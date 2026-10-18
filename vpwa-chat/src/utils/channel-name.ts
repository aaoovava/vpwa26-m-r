export function validateChannelName(name: string): string {
  const channelName = name.trim();
  if (!channelName) throw new Error('Channel name cannot be empty.');
  if (/\s/.test(channelName)) {
    throw new Error('Channel name cannot contain spaces. Use a name like my-channel.');
  }
  return channelName;
}
