const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const fetch = require("node-fetch");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("dict")
        .setDescription("Create a web link to a given query")
        .addStringOption(option =>
            option.setName("query")
                .setDescription("Search query")
                .setRequired(true))
        .setContexts([0, 1]),

    async execute(interaction) {
        await interaction.deferReply();     // For slow API requests

        const query = interaction.options.getString('query').split(" ").slice(1).join(" ").toLowerCase().trim().normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/,/g, '').replace(/-/g, ' ').replace(/[‘’]/g, '\'');
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

            await interaction.editReply({
                content: `https://singlishdict.app/?q=${encodeURIComponent(data[0].trieId)}`
            });
        } catch (err) {
            console.error(err);
            message.reply(`⚠️ Got problem finding for your query.`);
        }
    }
};