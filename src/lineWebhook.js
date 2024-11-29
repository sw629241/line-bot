import { Client } from '@line/bot-sdk';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

// Logging utility
function logEvent(botType, event) {
  const logDir = path.join(process.cwd(), 'logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
  }

  const logFile = path.join(logDir, `${botType}_webhook_events.log`);
  const logEntry = `${new Date().toISOString()} - Bot: ${botType}, Event Type: ${event.type}, Source: ${JSON.stringify(event.source)}\n`;
  
  fs.appendFile(logFile, logEntry, (err) => {
    if (err) console.error('Error writing to log file:', err);
  });
}

// Webhook configuration factory
export function createWebhookHandler(botType = 'primary') {
  // Select configuration based on bot type
  const lineConfig = botType === 'primary' 
    ? {
        channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
        channelSecret: process.env.LINE_CHANNEL_SECRET
      }
    : {
        channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN_2,
        channelSecret: process.env.LINE_CHANNEL_SECRET_2
      };

  // Create Line client
  const client = new Client(lineConfig);

  // Webhook event handler
  async function handleWebhook(req, res) {
    try {
      const events = req.body.events;
      
      // Process each event
      const results = await Promise.all(
        events.map(async (event) => {
          try {
            // Log every incoming event
            logEvent(botType, event);
            return await handleWebhookEvent(event);
          } catch (error) {
            console.error(`Error handling event in ${botType} webhook:`, error);
            return null;
          }
        })
      );

      res.status(200).json(results);
    } catch (error) {
      console.error(`${botType} webhook error:`, error);
      res.status(500).end();
    }
  }

  // Handle different event types
  async function handleWebhookEvent(event) {
    switch (event.type) {
      case 'message':
        return handleMessageEvent(event);
      case 'follow':
        return handleFollowEvent(event);
      case 'unfollow':
        return handleUnfollowEvent(event);
      case 'join':
        return handleJoinEvent(event);
      case 'leave':
        return handleLeaveEvent(event);
      default:
        console.log(`Unhandled event type in ${botType} webhook:`, event.type);
        return null;
    }
  }

  // Handle message events with more complex logic
  async function handleMessageEvent(event) {
    if (event.message.type === 'text') {
      const messageText = event.message.text.toLowerCase().trim();
      
      // Simple command handling
      const commands = {
        'help': 'Available commands: help, status, time',
        'status': `${botType.toUpperCase()} bot is online and ready!`,
        'time': `Current time: ${new Date().toLocaleString()}`
      };

      const response = commands[messageText] || 
        `${botType.toUpperCase()} webhook received: ${event.message.text}`;

      const echo = { 
        type: 'text', 
        text: response
      };
      
      try {
        return await client.replyMessage(event.replyToken, echo);
      } catch (error) {
        console.error(`Error replying to message in ${botType} webhook:`, error);
        throw error;
      }
    }
    return null;
  }

  // Handle follow event
  async function handleFollowEvent(event) {
    try {
      const welcomeMessage = {
        type: 'text',
        text: `Welcome to ${botType.toUpperCase()} webhook! 
Type 'help' to see available commands.`
      };
      return await client.replyMessage(event.replyToken, welcomeMessage);
    } catch (error) {
      console.error(`Error handling follow event in ${botType} webhook:`, error);
      throw error;
    }
  }

  // Handle unfollow event
  function handleUnfollowEvent(event) {
    console.log(`User unfollowed in ${botType} webhook:`, event.source.userId);
    return null;
  }

  // Handle join event (when bot is added to a group or room)
  async function handleJoinEvent(event) {
    try {
      const joinMessage = {
        type: 'text',
        text: `Thanks for adding me to this ${event.source.type}! 
I'm the ${botType.toUpperCase()} bot. Type 'help' to see what I can do.`
      };
      return await client.replyMessage(event.replyToken, joinMessage);
    } catch (error) {
      console.error(`Error handling join event in ${botType} webhook:`, error);
      throw error;
    }
  }

  // Handle leave event (when bot is removed from a group or room)
  function handleLeaveEvent(event) {
    console.log(`Bot was removed from ${event.source.type} in ${botType} webhook`);
    return null;
  }

  return { handleWebhook };
}
