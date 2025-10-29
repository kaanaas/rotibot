const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');

async function registerCommands(client) {
    const commands = [];
    const commandsPath = path.join(__dirname, 'commands');
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        commands.push(command.data.toJSON());
    }

    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

    try {
        console.log('⏳ Updating slash commands...');
        await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID),
            { body: commands },
        );
        console.log('✅ Slash commands updated automatically!');
    } catch (error) {
        console.error('Failed to register commands:', error);
    }
}

module.exports = { registerCommands };
