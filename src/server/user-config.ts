import { promises as fs } from 'fs';
import { homedir } from 'os';
import { dirname, join } from 'path';

const CONFIG_DIR_NAME = 'difit';
const CONFIG_FILE_NAME = 'config.json';

function getUserConfigPath(): string {
  const xdgConfig = process.env.XDG_CONFIG_HOME;
  const baseDir = xdgConfig && xdgConfig.length > 0 ? xdgConfig : join(homedir(), '.config');
  return join(baseDir, CONFIG_DIR_NAME, CONFIG_FILE_NAME);
}

export async function readUserConfig(): Promise<Record<string, unknown>> {
  const path = getUserConfigPath();
  try {
    const raw = await fs.readFile(path, 'utf8');
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return {};
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      return {};
    }
    throw err;
  }
}

export async function patchUserConfig(
  patch: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const current = await readUserConfig();
  const merged = { ...current, ...patch };
  const path = getUserConfigPath();
  await fs.mkdir(dirname(path), { recursive: true });
  // Pretty-printed for human-friendly editing.
  await fs.writeFile(path, `${JSON.stringify(merged, null, 2)}\n`, 'utf8');
  return merged;
}
