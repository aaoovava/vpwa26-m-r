export type ParsedCommand =
  | { type: 'join'; name: string; isPrivate: boolean }
  | { type: 'invite'; nickName: string }
  | { type: 'list' }
  | { type: 'cancel' }
  | { type: 'quit' }
  | { type: 'mention'; nickName: string; text: string }
  | { type: 'message'; text: string }
  | { type: 'error'; message: string };

// Matches @nickname anywhere in the text.
// The lookbehind skips cases like "user@example.com" (a word char or "@" right before "@").
const MENTION_REGEX = /(?<![\w@])@([\w-]+)/;

export function parseInput(raw: string): ParsedCommand {
  const input = raw.trim();
  if (!input) return { type: 'error', message: 'Message cannot be empty.' };

  if (!input.startsWith('/')) {
    const match = input.match(MENTION_REGEX);
    if (match) {
      // The first mention is used; text keeps the full original message
      return { type: 'mention', nickName: match[1]!, text: input };
    }
    return { type: 'message', text: input };
  }

  // Slash command
  const parts = input.slice(1).split(/\s+/);
  const command = parts[0]?.toLowerCase() ?? '';
  const args = parts.slice(1);

  switch (command) {
    case 'join': {
      const name = args[0];
      if (!name) return { type: 'error', message: 'Usage: /join channelName [private]' };
      const isPrivate = args[1]?.toLowerCase() === 'private';
      return { type: 'join', name, isPrivate };
    }

    case 'invite': {
      const nickName = args[0];
      if (!nickName) return { type: 'error', message: 'Usage: /invite nickName' };
      return { type: 'invite', nickName };
    }

    case 'list':
      return { type: 'list' };

    case 'cancel':
      return { type: 'cancel' };

    case 'quit':
      return { type: 'quit' };

    default:
      return { type: 'error', message: `Unknown command: /${command}` };
  }
}