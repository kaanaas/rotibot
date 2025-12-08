require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { Client, Collection, GatewayIntentBits, AttachmentBuilder, MessageFlags } = require("discord.js");
const { registerCommands } = require("./commandHandler");
// const fetch = require("node-fetch");

const express = require('express');
const app = express();
const port = process.env.PORT || 10000;

const PREFIX = '!';

app.listen(port, () => {
    console.log(`Rotibot listening on port ${port}`);
});

// Basic root route
app.get("/", (req, res) => {
    res.send("Hello, I am Rotibot!");
});

// Ping route for cron-job.org
app.get("/ping", (req, res) => {
    console.log(`[PING] Received wakey-wakey ping.`);
    res.send("OK");
});

const client = new Client({
    intents: [
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
    partials: ['CHANNEL'],      // for DMs
});

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

client.commands = new Collection();

for (const file of commandFiles) {
    let filePath = path.join(commandsPath, file);
    const command = require(filePath);
    client.commands.set(command.data.name, command);
}


client.once("clientReady", async () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
    await registerCommands(client);     // wait for slash commands auto update in commandHandler.js
});

client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    // If interaction is in a DM (no guildId)
    if (!interaction.guildId) {
        if (interaction.user.id !== OWNER_ID) interaction.reply({
            content: "Paiseh, you are not authorized to use this command in DMs.",
            ephemeral: true
        });
    }

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (err) {
        console.error(err);
        await interaction.reply({ content: 'Got problem executing this command...', flags: MessageFlags.Ephemeral });
    }
})

// OLD ! commands
client.on("messageCreate", async (message) => {
    // ignore other bots
    if (message.author.bot) return;
    // // only owner can use
    // if (message.author.id !== process.env.OWNER_ID) message.reply(`Paiseh, you are not authorized to use this command in DMs.`);
    // // restrict to DMs
    // if (message.channel.type !== 1) return;
    // handle only valid commands
    if (!(message.content.startsWith(PREFIX))) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command == "help") {
        return message.reply("`!dict`: Create a link to the online dictionary for a given query\n`!doc`: Search for and return a document from the database as a .json file\n`!ety`: Search for and return an etymology from the database as a .json file");
    } else if (command == "ping") {
        return message.reply("Pong!");
    }

    const query = message.content.split(" ").slice(PREFIX.length).join(" ").toLowerCase().trim().normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/,/g, '').replace(/-/g, ' ').replace(/[‘’]/g, '\'');
    if (!query) return;

    if (command == "ety") {
        try {
            const res = await fetch(`${process.env.API_URL}/ety?q=${encodeURIComponent(query)}`, {
                headers: { "x-api-key": process.env.API_KEY }
            });

            const data = await res.json();
            if (!Array.isArray(data) || data.length === 0) {
                return message.reply(`No results found for: **\`${query}\`**`);
            }

            if (data.error) {
                return message.reply(`❌ ${data.error}`);
            }

            const jsonString = JSON.stringify(data, null, 2);
            // convert to file attachment (often >4000 char limit)
            const attachment = new AttachmentBuilder(Buffer.from(jsonString, "utf-8"), {
                name: `${query}.json`
            });
            return message.reply({
                content: `Result for **\`${query}\`**:`, files: [attachment]
            });

        } catch (err) {
            console.error(err);
            message.reply("⚠️ Got problem calling the API.");
        }
    }

    else {
        try {
            const res = await fetch(`${process.env.API_URL}/doc?q=${encodeURIComponent(query)}`, {
                headers: { "x-api-key": process.env.API_KEY }
            });

            const data = await res.json();
            if (!Array.isArray(data) || data.length === 0) {
                return message.reply(`No results found for: **\`${query}\`**`);
            }

            if (data.error) {
                return message.reply(`❌ ${data.error}`);
            }

            if (command == "dict") {
                return message.reply(`https://singlishdict.app/?q=${data[0].trieId}`);
            } else if (command == "doc") {
                const jsonString = JSON.stringify(data, null, 2);
                // convert to file attachment (often >4000 char limit)
                const attachment = new AttachmentBuilder(Buffer.from(jsonString, "utf-8"), {
                    name: `${query}.json`
                });
                return message.reply({
                    content: `Result for **\`${query}\`**:`, files: [attachment]
                });
            }
        } catch (err) {
            console.error(err);
            message.reply("⚠️ Got problem calling the API.");
        }
    }
})

client.login(process.env.DISCORD_TOKEN);
