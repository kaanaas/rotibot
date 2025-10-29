const { SlashCommandBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("help")
        .setDescription("List commands")
        .setContexts([0, 1]),
    async execute(interaction) {
        await interaction.reply("`dict`: Create a link to the online dictionary for a given query\n`doc`: Search for and return a document from the database as a .txt file");
    }
};