const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const fetch = require("node-fetch");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("doc")
        .setDescription("Search for and return a document from the database as a .txt file")
        .addStringOption(option => {
            option.setName("query")
                .setDescription("Search query")
                .setRequired(true)
        }),

    async execute(interaction) {
        await interaction.deferReply();     // For slow API requests

        const query = interaction.options.getString('query');
        const apiURL = `https://singlishdict.app/?q=${encodeURIComponent(query)}`;

        try {
            const res = await fetch(apiURL);
            const data = await res.json();

            if (!Array.isArray(data) || data.length === 0) {
                return interaction.editReply(`Neh find anything for: **${query}**`);
            }

            if (data.error) {
                return message.reply(`❌ ${data.error}`);
            }

            const jsonString = JSON.stringify(data, null, 2);
            // convert to file attachment (often >4000 char limit)
            const attachment = new AttachmentBuilder(Buffer.from(jsonString, "utf-8"), {
                name: `${query}.txt`
            });

            await interaction.editReply({
                content: `Result for **${query}**:`,
                files: [attachment]
            });
        } catch (err) {
            console.error(err);
            message.reply("⚠️ Got problem finding for the document.");
        }
    }
};