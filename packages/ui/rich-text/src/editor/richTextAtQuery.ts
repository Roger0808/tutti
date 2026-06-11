import type {
  RichTextAtQueryInput,
  RichTextAtQueryMatch,
  RichTextAtRegistry
} from "../types/at.ts";

export interface RichTextAtQueryState {
  from: number;
  to: number;
  keyword: string;
}

function isTriggerPrefixBoundary(character: string): boolean {
  return /[\s,;:!?<>{}|\\'"`~()[\]]/.test(character);
}

export function findRichTextAtQuery(
  value: string,
  caret: number
): RichTextAtQueryState | null {
  const cursor = Math.max(0, Math.min(caret, value.length));
  let segmentStart = cursor;
  while (segmentStart > 0) {
    const previous = value[segmentStart - 1] ?? "";
    if (/\s/.test(previous)) {
      break;
    }
    segmentStart -= 1;
  }

  const segment = value.slice(segmentStart, cursor);
  for (
    let index = segment.lastIndexOf("@");
    index >= 0;
    index = segment.lastIndexOf("@", index - 1)
  ) {
    const previous = segment[index - 1] ?? "";
    if (index > 0 && !isTriggerPrefixBoundary(previous)) {
      continue;
    }

    const candidate = segment.slice(index);
    if (/[[\]()]/.test(candidate.slice(1))) {
      return null;
    }

    return {
      from: segmentStart + index,
      to: cursor,
      keyword: candidate.slice(1)
    };
  }

  return null;
}

export async function queryRichTextAtMatches(
  registry: RichTextAtRegistry,
  input: RichTextAtQueryInput
): Promise<readonly RichTextAtQueryMatch[]> {
  try {
    return await registry.query(input);
  } catch {
    return [];
  }
}
