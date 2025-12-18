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
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
    model: process.env.OPENAI_MODEL || 'gpt-4',
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--api-key' && args[i + 1]) {
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

  // Remove ```typescript, ```tsx, or ``` markers
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/```(typescript|tsx)?\n?/, '').replace(/```\s*$/, '');
  }

  return cleaned.trim();
}

// Validate TypeScript code structure
function validateTypeScriptCode(code) {
  // Should start with import or interface/type
  if (!/^(import|interface|type)/.test(code)) {
    return false;
  }

  // Should end with }
  if (!/}\s*$/.test(code)) {
    return false;
  }

  // Should contain 'export default'
  if (!code.includes('export default')) {
    return false;
  }

  return true;
}

async function main() {
  const args = parseArgs();

  if (!args.apiKey) {
    console.error('Error: OPENAI_API_KEY environment variable or --api-key argument is required');
    console.error('Set it in .env file or pass --api-key');
    process.exit(1);
  }

  console.log('Generating widget component...');

  // Read widget data
  const dataPath = path.join(projectRoot, 'widget/response.json');

  if (!fs.existsSync(dataPath)) {
    console.error(`Error: Widget data not found at ${dataPath}`);
    console.error('Run generate-data.js first to create response.json');
    process.exit(1);
  }

  console.log('Reading widget data...');
  const widgetData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

  // Read prompt
  const promptPath = path.join(projectRoot, 'docs/prompts/appdata2widget-ts.md');
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
          content: `Generate a TypeScript React widget component for this data:\n\n${JSON.stringify(widgetData, null, 2)}`,
        },
      ],
      temperature: 0.7,
    });

    const rawOutput = response.choices[0].message.content;
    console.log('Received response from LLM');

    // Parse and validate TypeScript code
    const cleanedCode = stripCodeFences(rawOutput);

    if (!validateTypeScriptCode(cleanedCode)) {
      console.error('Error: Invalid TypeScript code structure');
      console.error('Code should start with import/interface and end with }');
      console.error('Raw response:', rawOutput);
      process.exit(1);
    }

    // Write to file
    const outputPath = path.join(projectRoot, 'widget/Widget.tsx');
    fs.writeFileSync(outputPath, cleanedCode);

    console.log(`✓ Widget component generated successfully!`);
    console.log(`  Output: ${outputPath}`);
    console.log(`  Next: Run 'npm run dev' to view the widget`);
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('API Error:', error.response.data);
    }
    process.exit(1);
  }
}

main();
