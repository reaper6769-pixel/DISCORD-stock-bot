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
const TOKEN = process.env.TOKEN;
const CLIENT_ID = '1471159669136298014';
const GUILD_ID = '1471072212621725698';
const ADMIN_ID = '1359526601905279037'; // MUST be numbers only
// ====================================

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// ===== SLASH COMMANDS =====
const commands = [
  new SlashCommandBuilder()
    .setName('gen')
    .setDescription('Generate one stock item'),

  new SlashCommandBuilder()
    .setName('stock')
    .setDescription('Check available stock'),

  new SlashCommandBuilder()
    .setName('addstock')
    .setDescription('Add stock (Admin only)')
    .addStringOption(option =>
      option.setName('item')
        .setDescription('Paste multiple stock lines (one per line)')
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

  // ===== GENERATE STOCK =====
  if (interaction.commandName === 'gen') {
    if (!fs.existsSync('./stock.txt')) {
      return interaction.reply('❌ No stock file found.');
    }

    let data = fs.readFileSync('./stock.txt', 'utf8');
    let lines = data.split('\n').filter(line => line.trim() !== '');

    if (lines.length === 0) {
      return interaction.reply('❌ No stock available.');
    }

    const generated = lines.shift();
    fs.writeFileSync('./stock.txt', lines.join('\n'));

    return interaction.reply(`🎁 Generated:\n\`${generated}\``);
  }

  // ===== CHECK STOCK =====
  if (interaction.commandName === 'stock') {
    if (!fs.existsSync('./stock.txt')) {
      return interaction.reply('❌ No stock file found.');
    }

    const data = fs.readFileSync('./stock.txt', 'utf8');
    const lines = data.split('\n').filter(line => line.trim() !== '');

    return interaction.reply(`📦 Stock available: ${lines.length}`);
  }

  // ===== ADD STOCK =====
  if (interaction.commandName === 'addstock') {
    if (interaction.user.id !== ADMIN_ID) {
      return interaction.reply({ content: '❌ You are not admin!', ephemeral: true });
    }

    const items = interaction.options.getString('item');
    const stockArray = items.split('\n').filter(line => line.trim() !== '');

    fs.appendFileSync('./stock.txt', stockArray.join('\n') + '\n');

    return interaction.reply(`✅ Added ${stockArray.length} stock items!`);
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

    return interaction.reply(`🗑 Removed: ${removed}`);
  }
});

// ===== LOGIN =====
client.login(TOKEN);
