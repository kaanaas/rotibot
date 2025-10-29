const { SlashCommandBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("help")
        .setDescription("List commands"),
    async execute(interaction) {
        await interaction.reply("`dict`: Create a web link to a given query\n`doc`: Search for and return a document from the database as a .txt file");
    }
};