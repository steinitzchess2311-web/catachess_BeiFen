import type { Command, CommandContext, CommandResult } from '../types';

const fortunes = [
  "A journey of a thousand miles begins with a single step.",
  "The best time to plant a tree was 20 years ago. The second best time is now.",
  "In the middle of difficulty lies opportunity. - Albert Einstein",
  "The only way to do great work is to love what you do. - Steve Jobs",
  "Stay hungry, stay foolish. - Steve Jobs",
  "Talk is cheap. Show me the code. - Linus Torvalds",
  "First, solve the problem. Then, write the code. - John Johnson",
  "Any fool can write code that a computer can understand. Good programmers write code that humans can understand. - Martin Fowler",
  "It's not a bug, it's a feature!",
  "There are only 10 types of people in the world: those who understand binary and those who don't.",
  "A SQL query walks into a bar, walks up to two tables and asks, 'Can I join you?'",
  "Why do programmers prefer dark mode? Because light attracts bugs!",
  "To understand recursion, you must first understand recursion.",
  "640K ought to be enough for anybody. - Bill Gates (allegedly)",
  "The best error message is the one that never shows up.",
  "If debugging is the process of removing bugs, then programming must be the process of putting them in.",
  "Programming is like writing a book... except if you miss a single comma on page 126, the whole thing makes no sense.",
  "The only constant in software is change.",
  "Keep calm and clear the cache.",
  "There's no place like 127.0.0.1",
  "!false - It's funny because it's true.",
  "A good programmer is someone who looks both ways before crossing a one-way street.",
  "Copy-and-Paste was programmed by programmers for programmers.",
  "I don't always test my code, but when I do, I do it in production.",
  "The code works, don't ask me how.",
  "Weeks of coding can save you hours of planning.",
  // Chess related
  "Every chess master was once a beginner.",
  "The pawns are the soul of chess. - Philidor",
  "When you see a good move, look for a better one. - Emanuel Lasker",
  "Chess is the gymnasium of the mind. - Blaise Pascal",
  "In chess, as in life, the best move is always the one you make.",
];

export const fortuneCommand: Command = {
  name: 'fortune',
  aliases: [],
  description: 'Display a random fortune',
  usage: 'fortune',
  handler: (_ctx: CommandContext): CommandResult => {
    const randomIndex = Math.floor(Math.random() * fortunes.length);
    const fortune = fortunes[randomIndex];

    return {
      output: ['', fortune, ''],
    };
  },
};
