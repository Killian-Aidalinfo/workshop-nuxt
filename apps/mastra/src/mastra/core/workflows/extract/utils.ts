import { exec } from 'child_process';
import { mkdir, writeFile, readdir, readFile, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function pdfToImages(data: Uint8Array): Promise<string[]> {
  const tmpDir = join(tmpdir(), `pdf-${Date.now()}`);
  const tmpPdf = join(tmpDir, 'input.pdf');
  const outPrefix = join(tmpDir, 'page');

  await mkdir(tmpDir, { recursive: true });
  await writeFile(tmpPdf, data);

  await execAsync(`pdftoppm -jpeg -r 200 "${tmpPdf}" "${outPrefix}"`);

  const files = (await readdir(tmpDir))
    .filter((f) => f.startsWith('page') && f.endsWith('.jpg'))
    .sort();

  const images = await Promise.all(
    files.map(async (f) => {
      const buf = await readFile(join(tmpDir, f));
      return `data:image/jpeg;base64,${buf.toString('base64')}`;
    }),
  );

  await rm(tmpDir, { recursive: true });
  return images;
}

export type ImagePart = {
  type: 'image';
  image: string;
  mimeType: string;
};

export async function downloadDocument(url: string): Promise<ImagePart[]> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download document: ${response.status} ${response.statusText}`);
  }

  const contentType = response.headers.get('content-type') ?? '';
  const data = new Uint8Array(await response.arrayBuffer());

  if (contentType.includes('pdf')) {
    const pages = await pdfToImages(data);
    return pages.map((image) => ({ type: 'image', image, mimeType: 'image/jpeg' }));
  }

  const base64 = Buffer.from(data).toString('base64');
  const mimeType = contentType || 'image/jpeg';
  return [{ type: 'image', image: `data:${mimeType};base64,${base64}`, mimeType }];
}
