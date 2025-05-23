# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a multiplayer "Wer ist es?" (Guess Who?) game built with Node.js, Express, Socket.io, and vanilla JavaScript. Players create or join game rooms and try to guess each other's selected character by asking yes/no questions.

## Architecture

- **Backend**: Node.js server (`server.js`) using Express and Socket.io for real-time multiplayer communication
- **Frontend**: Single-page application (`public/index.html`) with vanilla JavaScript client
- **Game State**: In-memory storage using Maps for game rooms and player sessions
- **Communication**: WebSocket-based real-time events between client and server

## Development Commands

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon (auto-restart on changes)
- `npm test` - Run tests (currently placeholder)

## Key Game Flow

1. **Room Creation/Joining**: Players create 6-character room codes or join existing rooms
2. **Character Selection**: Each player secretly selects a character from 16 predefined characters
3. **Question Phase**: Players take turns asking yes/no questions about opponent's character
4. **Elimination**: Players eliminate characters based on answers received
5. **Guessing**: Players can attempt to guess the opponent's character to win

## Character Data Structure

Characters have attributes: `name`, `hair`, `eyes`, `glasses`, `hat`, `beard`, `gender`, `age`. All text is in German.

## Socket Events

Key client-server events include: `createRoom`, `joinRoom`, `startGame`, `selectCharacter`, `askQuestion`, `answerQuestion`, `makeGuess`, `eliminateCharacter`.

## Server Configuration

- Port: `process.env.PORT || 3000` (Railway deployment ready)
- CORS enabled for all origins
- Health check endpoint: `/health`
- Stats endpoint: `/stats`
- Auto-cleanup of inactive rooms (30 min timeout)