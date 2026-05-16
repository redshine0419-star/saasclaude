export type DiffLineType = 'add' | 'remove' | 'same';

export interface DiffLine {
  type: DiffLineType;
  content: string;
  lineNo: number; // line number in the relevant file (before for remove/same, after for add)
}

export function computeDiff(before: string, after: string): DiffLine[] {
  const a = before.split('\n');
  const b = after.split('\n');

  // LCS-based diff (Myers-lite: good enough for source files)
  const m = a.length;
  const n = b.length;

  // dp[i][j] = length of LCS of a[0..i-1] and b[0..j-1]
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }

  const result: DiffLine[] = [];
  let i = m, j = n;
  const ops: Array<[DiffLineType, string]> = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
      ops.push(['same', a[i - 1]]); i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      ops.push(['add', b[j - 1]]); j--;
    } else {
      ops.push(['remove', a[i - 1]]); i--;
    }
  }

  ops.reverse();

  let beforeLine = 1;
  let afterLine = 1;
  for (const [type, content] of ops) {
    if (type === 'same') {
      result.push({ type, content, lineNo: beforeLine });
      beforeLine++; afterLine++;
    } else if (type === 'remove') {
      result.push({ type, content, lineNo: beforeLine });
      beforeLine++;
    } else {
      result.push({ type, content, lineNo: afterLine });
      afterLine++;
    }
  }

  return result;
}
