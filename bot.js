const { Client, GatewayIntentBits, AttachmentBuilder } = require("discord.js");
const fetch = require("node-fetch");
require("dotenv").config();

const express = require('express');
const app = express();
const port = process.env.PORT || 10000;

app.listen(port, () => {
    console.log(`Rotibot listening on port ${port}`);
})

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.on("clientReady", () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
    // ignore other bots
    if (message.author.bot) return;
    // restrict to BOT channel
    if (message.channel.id !== process.env.BOT_CHANNEL_ID) return;
    // handle only valid commands
    if (!(message.content.startsWith("!json") || message.content.startsWith("!dict") || message.content.startsWith("!help"))) return;

    const query = message.content.split(" ").slice(1).join(" ").toLowerCase().trim().normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/,/g, '').replace(/-/g, ' ').replace(/[‘’]/g, '\'');
    if (!query) return;

    try {
        const res = await fetch(`${process.env.API_URL}?q=${encodeURIComponent(query)}`, {
            headers: { "x-api-key": process.env.API_KEY }
        });

        const data = await res.json();

        if (data.error) {
            return message.reply(`❌ ${data.error}`);
        }

        if (message.content.startsWith("!help")) {
            return message.reply("Use `!dict [QUERY]` to create a link to a word in the dictionary. Use `!json [QUERY]` to retrieve data from the database.");
        } else if (message.content.startsWith("!dict")) {
            return message.reply(`https://singlishdict.app/?q=${encodeURIComponent(data[0].trieId)}`);
        } else if (message.content.startsWith("!json")) {
            const jsonString = JSON.stringify(data, null, 2);
            // convert to file attachment (often >4000 char limit)
            const attachment = new AttachmentBuilder(Buffer.from(jsonString, "utf-8"), {
                name: `${query}.txt`
            });
            return message.reply({
                content: `**${query}**`, files: [attachment]
            });
        }
    } catch (err) {
        console.error(err);
        message.reply("⚠️ Got problem calling the API.");
    }
})

client.login(process.env.DISCORD_TOKEN);