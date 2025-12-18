#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

// Load environment variables from .env file
dotenv.config({ path: path.join(projectRoot, '.env') });

// Parse CLI arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {
    appId: null,
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
    model: process.env.OPENAI_MODEL || 'gpt-4',
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--app-id' && args[i + 1]) {
      parsed.appId = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === '--api-key' && args[i + 1]) {
      parsed.apiKey = args[i + 1];
      i++;
    } else if (args[i] === '--base-url' && args[i + 1]) {
      parsed.baseURL = args[i + 1];
      i++;
    }
  }

  return parsed;
}

// Strip markdown code fences from response
function stripCodeFences(content) {
  let cleaned = content.trim();

  // Remove ```json or ``` markers
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/```json\n?/, '').replace(/```\s*$/, '');
  }

  return cleaned.trim();
}

async function main() {
  const args = parseArgs();

  // Validate required arguments
  if (args.appId === null) {
    console.error('Error: --app-id is required');
    console.error('Usage: node generate-data.js --app-id <number> [--api-key <key>] [--base-url <url>]');
    process.exit(1);
  }

  if (!args.apiKey) {
    console.error('Error: OPENAI_API_KEY environment variable or --api-key argument is required');
    console.error('Set it in .env file or pass --api-key');
    process.exit(1);
  }

  console.log(`Generating widget data for app ID: ${args.appId}`);

  // Read app data
  const dataPath = path.join(projectRoot, 'data/app_intents_v4.6a.json');

  if (!fs.existsSync(dataPath)) {
    console.error(`Error: Data file not found at ${dataPath}`);
    console.error('Make sure app_intents_v4.6a.json exists in the data/ directory');
    process.exit(1);
  }

  console.log('Reading app data...');
  const allApps = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

  if (!Array.isArray(allApps) || args.appId >= allApps.length) {
    console.error(`Error: Invalid app ID ${args.appId}. Available apps: 0-${allApps.length - 1}`);
    process.exit(1);
  }

  // Extract single app
  const appData = allApps[args.appId];
  console.log(`Selected app: ${appData.appName || 'Unknown'}`);

  // Read prompt
  const promptPath = path.join(projectRoot, 'docs/prompts/app2data.md');
  const promptContent = fs.readFileSync(promptPath, 'utf-8');

  // Initialize OpenAI client
  const client = new OpenAI({
    apiKey: args.apiKey,
    baseURL: args.baseURL,
  });

  console.log('Calling LLM API...');

  try {
    const response = await client.chat.completions.create({
      model: args.model,
      messages: [
        {
          role: 'system',
          content: promptContent,
        },
        {
          role: 'user',
          content: `App Data:\n${JSON.stringify(appData, null, 2)}`,
        },
      ],
      temperature: 0.7,
    });

    const rawOutput = response.choices[0].message.content;
    console.log('Received response from LLM');

    // Parse and validate JSON
    const cleanedOutput = stripCodeFences(rawOutput);
    let widgetData;

    try {
      widgetData = JSON.parse(cleanedOutput);
    } catch (parseError) {
      console.error('Error: Failed to parse LLM response as JSON');
      console.error('Raw response:', rawOutput);
      throw parseError;
    }

    // Validate structure
    if (!widgetData.widget || !widgetData.data || !widgetData.meta) {
      console.error('Error: Invalid widget data structure');
      console.error('Expected: { widget: {...}, data: {...}, meta: {...} }');
      console.error('Got:', widgetData);
      process.exit(1);
    }

    // Create widget directory if it doesn't exist
    const widgetDir = path.join(projectRoot, 'widget');
    if (!fs.existsSync(widgetDir)) {
      fs.mkdirSync(widgetDir, { recursive: true });
    }

    // Write to file
    const outputPath = path.join(widgetDir, 'response.json');
    fs.writeFileSync(outputPath, JSON.stringify(widgetData, null, 2));

    console.log(`✓ Widget data generated successfully!`);
    console.log(`  Output: ${outputPath}`);
    console.log(`  Widget ID: ${widgetData.widget.id}`);
    console.log(`  App: ${widgetData.widget.app}`);
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('API Error:', error.response.data);
    }
    process.exit(1);
  }
}

main();
