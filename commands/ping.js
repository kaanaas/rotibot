const { SlashCommandBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("ping")
        .setDescription("Replies with Pong!")
        .setContexts([0, 1]),
    async execute(interaction) {
        await interaction.reply("Pong!");
    }
};