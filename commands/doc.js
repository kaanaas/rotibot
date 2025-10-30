const { SlashCommandBuilder, InteractionContextType, AttachmentBuilder } = require('discord.js');
const fetch = require("node-fetch");

function fetchWithTimeout(url, options = {}, timeout = 7000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    return fetch(url, { ...options, signal: controller.signal })
        .finally(() => clearTimeout(timer));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("doc")
        .setDescription("Search for and return a document from the database as a .txt file")
        .addStringOption(option =>
            option.setName("query")
                .setDescription("Search query")
                .setRequired(true))
        .setContexts([InteractionContextType.Guild, InteractionContextType.BotDM]),

    async execute(interaction) {
        await interaction.deferReply();     // For slow API requests

        const query = interaction.options.getString('query').toLowerCase().trim().normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/,/g, '').replace(/-/g, ' ').replace(/[‘’]/g, '\'');
        const apiURL = `${process.env.API_URL}?q=${encodeURIComponent(query)}`;

        try {
            const res = await fetchWithTimeout(apiURL, {
                headers: { 'x-api-key': process.env.API_KEY }
            });
            const data = await res.json();

            if (!Array.isArray(data) || data.length === 0) {
                return interaction.editReply(`Neh find anything for: **\`${query}\`**`);
            }

            if (data.error) {
                return message.reply(`❌ ${data.error}`);
            }

            const jsonString = JSON.stringify(data, null, 2);
            // convert to file attachment (often >4000 char limit)
            const attachment = new AttachmentBuilder(Buffer.from(jsonString, "utf-8"), {
                name: `${query}.json`
            });

            await interaction.editReply({
                content: `Result for **\`${query}\`**:`,
                files: [attachment]
            });
        } catch (err) {
            // ✅ prevent infinite thinking —
            await interaction.editReply('⚠️ Wait long long liao. Try again later.');
            console.error(err);
        }
    }
};