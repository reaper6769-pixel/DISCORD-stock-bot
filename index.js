// ===== EXPRESS SERVER (FOR RENDER PORT) =====
const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('Bot is online ✅');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// ===== DISCORD BOT CODE =====
const { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes } = require('discord.js');
const fs = require('fs');

// ====== PUT YOUR DETAILS HERE ======
const TOKEN = process.env.TOKEN; // Put token in Render Environment Variables
const CLIENT_ID = 'YOUR_CLIENT_ID_HERE';
const GUILD_ID = 'YOUR_GUILD_ID_HERE';
const ADMIN_ID = 'YOUR_DISCORD_ID_HERE'; // Your personal Discord ID
// ====================================

// Create client
const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// ===== SLASH COMMANDS =====
const commands = [
  new SlashCommandBuilder()
    .setName('stock')
    .setDescription('Check available stock'),

  new SlashCommandBuilder()
    .setName('addstock')
    .setDescription('Add stock (Admin only)')
    .addStringOption(option =>
      option.setName('item')
        .setDescription('Stock to add (email:pass)')
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('removestock')
    .setDescription('Remove one stock (Admin only)')
].map(command => command.toJSON());

// ===== REGISTER COMMANDS =====
const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {
    console.log('Registering slash commands...');

    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands }
    );

    console.log('Commands registered successfully.');
  } catch (error) {
    console.error(error);
  }
})();

// ===== INTERACTION HANDLER =====
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  // ===== CHECK STOCK =====
  if (interaction.commandName === 'stock') {
    if (!fs.existsSync('./stock.txt')) {
      return interaction.reply('❌ stock.txt file not found.');
    }

    const data = fs.readFileSync('./stock.txt', 'utf8');
    const lines = data.split('\n').filter(line => line.trim() !== '');

    await interaction.reply(`📦 Stock available: ${lines.length}`);
  }

  // ===== ADD STOCK =====
  if (interaction.commandName === 'addstock') {
    if (interaction.user.id !== ADMIN_ID) {
      return interaction.reply({ content: '❌ You are not admin!', ephemeral: true });
    }

    const item = interaction.options.getString('item');

    fs.appendFileSync('./stock.txt', item + '\n');

    await interaction.reply('✅ Stock added successfully!');
  }

  // ===== REMOVE STOCK =====
  if (interaction.commandName === 'removestock') {
    if (interaction.user.id !== ADMIN_ID) {
      return interaction.reply({ content: '❌ You are not admin!', ephemeral: true });
    }

    if (!fs.existsSync('./stock.txt')) {
      return interaction.reply('❌ No stock file found.');
    }

    let data = fs.readFileSync('./stock.txt', 'utf8');
    let lines = data.split('\n').filter(line => line.trim() !== '');

    if (lines.length === 0) {
      return interaction.reply('❌ No stock available.');
    }

    const removed = lines.shift();

    fs.writeFileSync('./stock.txt', lines.join('\n'));

    await interaction.reply(`🗑 Removed: ${removed}`);
  }
});

// ===== LOGIN =====
client.login(TOKEN);
