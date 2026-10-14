export type ParsedCommand =
  | { type: 'join'; name: string; isPrivate: boolean }
  | { type: 'invite'; nickName: string }
  | { type: 'list' }
  | { type: 'cancel' }
  | { type: 'quit' }
  | { type: 'mention'; nickName: string; text: string }
  | { type: 'message'; text: string }
  | { type: 'error'; message: string };

// @nickname some text
const MENTION_REGEX = /^@([\w-]+)\s+(.+)$/s;

export function parseInput(raw: string): ParsedCommand {
  const input = raw.trim();
  if (!input) return { type: 'error', message: 'Message cannot be empty.' };

  // Mention: @nick text
  if (input.startsWith('@')) {
    const match = input.match(MENTION_REGEX);
    if (!match) {
      return { type: 'error', message: 'Mention must be in format: @nickname message' };
    }
    return { type: 'mention', nickName: match[1]!, text: match[2]!.trim() };
  }

  // Regular message
  if (!input.startsWith('/')) {
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