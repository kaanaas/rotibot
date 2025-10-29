require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { Client, Collection, GatewayIntentBits, AttachmentBuilder } = require("discord.js");
const { registerCommands } = require("./commandHandler");
// const fetch = require("node-fetch");

const express = require('express');
const app = express();
const port = process.env.PORT || 10000;

app.listen(port, () => {
    console.log(`Rotibot listening on port ${port}`);
})

const client = new Client({
    intents: [
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.Guilds,
        // GatewayIntentBits.GuildMessages,
        // GatewayIntentBits.MessageContent,
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
        if (interaction.user.id !== OWNER_ID) return;
    }

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (err) {
        console.error(err);
        await interaction.reply({ content: 'Got problem executing this command...', ephemeral: true });
    }
})

// // OLD (! commands)
// client.on("messageCreate", async (message) => {
//     // ignore other bots
//     if (message.author.bot) return;
//     // restrict to BOT channel
//     if (message.channel.id !== process.env.BOT_CHANNEL_ID) return;
//     // handle only valid commands
//     if (!(message.content.startsWith("!json") || message.content.startsWith("!dict") || message.content.startsWith("!help"))) return;

//     const query = message.content.split(" ").slice(1).join(" ").toLowerCase().trim().normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/,/g, '').replace(/-/g, ' ').replace(/[‘’]/g, '\'');
//     if (!query) return;

//     try {
//         const res = await fetch(`${process.env.API_URL}?q=${encodeURIComponent(query)}`, {
//             headers: { "x-api-key": process.env.API_KEY }
//         });

//         const data = await res.json();

//         if (data.error) {
//             return message.reply(`❌ ${data.error}`);
//         }

//         if (message.content.startsWith("!help")) {
//             return message.reply("Use `!dict [QUERY]` to create a link to a word in the dictionary. Use `!json [QUERY]` to retrieve data from the database.");
//         } else if (message.content.startsWith("!dict")) {
//             return message.reply(`https://singlishdict.app/?q=${encodeURIComponent(data[0].trieId)}`);
//         } else if (message.content.startsWith("!json")) {
//             const jsonString = JSON.stringify(data, null, 2);
//             // convert to file attachment (often >4000 char limit)
//             const attachment = new AttachmentBuilder(Buffer.from(jsonString, "utf-8"), {
//                 name: `${query}.txt`
//             });
//             return message.reply({
//                 content: `**${query}**`, files: [attachment]
//             });
//         }
//     } catch (err) {
//         console.error(err);
//         message.reply("⚠️ Got problem calling the API.");
//     }
// })

client.login(process.env.DISCORD_TOKEN);