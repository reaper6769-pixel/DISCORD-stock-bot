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
const CLIENT_ID = '1471159669136298014';
const GUILD_ID = '1471072212621725698';
const ADMIN_ID = 'gamer11yt___65957'; // Your personal Discord ID
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

  await interaction.reply(`🎁 Generated:\n\`${generated}\``);
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



