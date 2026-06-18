type ImageContent = {
  type: 'image';
  image: Uint8Array;
  mimeType: string;
};

type FileContent = {
  type: 'file';
  data: Uint8Array;
  mimeType: 'application/pdf';
};

export type DocumentContent = ImageContent | FileContent;

export async function downloadDocument(url: string): Promise<DocumentContent> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download document: ${response.status} ${response.statusText}`);
  }

  const contentType = response.headers.get('content-type') ?? '';
  const data = new Uint8Array(await response.arrayBuffer());

  if (contentType.includes('pdf')) {
    return { type: 'file', data, mimeType: 'application/pdf' };
  }

  return { type: 'image', image: data, mimeType: contentType || 'image/jpeg' };
}
