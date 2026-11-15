const labels = { passed: 'PASS', failed: 'FAIL', skipped: 'SKIP', pending: 'ATTESA' };
const tones = { passed: 'green', failed: 'red', skipped: 'yellow', pending: 'yellow' };
const codes = { green: '32', red: '31', yellow: '33', cyan: '36', dim: '2', title: '1;32', heading: '1;36' };
const plain = value => String(value).replace(/\x1b\[[0-9;]*m/g, '');
const length = value => Array.from(plain(value)).length;
const duration = value => !Number.isFinite(value) ? '-' : value < 1000 ? `${value.toFixed(1)} ms` : `${(value / 1000).toFixed(2)} s`;

// Preserve full names, wrapping at spaces when possible.
function wrap(value, width) {
  let chars = Array.from(plain(value).replace(/\s+/g, ' ').trim());
  const lines = [];
  while (chars.length > width) {
    const space = chars.slice(0, width + 1).lastIndexOf(' ');
    const end = space > 0 ? space : width;
    lines.push(chars.slice(0, end).join(''));
    chars = chars.slice(end);
    if (chars[0] === ' ') chars.shift();
  }
  lines.push(chars.join(''));
  return lines;
}

export default class TestTableReporter {
  onInit(vitest) {
    this.logger = vitest.logger;
    // Respect plain-text logs and the standard terminal color overrides.
    this.colors = process.env.NO_COLOR === undefined && process.env.FORCE_COLOR !== '0'
      && (process.env.FORCE_COLOR !== undefined || !!process.stdout.isTTY);
  }

  onTestRunStart() {
    this.startedAt = performance.now();
  }

  paint(value, tone = 'green') {
    return this.colors ? `\x1b[${codes[tone]}m${value}\x1b[0m` : String(value);
  }

  table(headers, rows, widths, { numeric = [], footer } = {}) {
    const border = (left, middle, right) => this.paint(left + widths.map(w => '─'.repeat(w + 2)).join(middle) + right, 'dim');
    const row = cells => {
      const wrapped = cells.map((cell, i) => wrap(cell, widths[i]));
      return Array.from({ length: Math.max(...wrapped.map(cell => cell.length)) }, (_, line) => {
        const padded = cells.map((cell, i) => {
          // Preserve the original color after wrapping and padding visible text.
          const tone = String(cell).match(/^\x1b\[([0-9;]+)m/)?.[1];
          const text = wrapped[i][line] || '';
          const padding = ' '.repeat(Math.max(0, widths[i] - length(text)));
          const value = numeric.includes(i) ? padding + text : text + padding;
          return tone ? `\x1b[${tone}m${value}\x1b[0m` : value;
        });
        return this.paint('│', 'dim') + ' ' + padded.join(' ' + this.paint('│', 'dim') + ' ') + ' ' + this.paint('│', 'dim');
      });
    };
    return [border('┌', '┬', '┐'), ...row(headers.map(h => this.paint(h, 'heading'))), border('├', '┼', '┤'),
      ...rows.flatMap(row), ...(footer ? [border('├', '┼', '┤'), ...row(footer)] : []), border('└', '┴', '┘')];
  }

  onTestRunEnd(modules, unhandledErrors = [], reason = 'passed') {
    const elapsed = performance.now() - (this.startedAt ?? performance.now());
    const columns = process.stdout.columns || 120;
    const nameWidth = Math.max(30, Math.min(100, columns - 33));
    const totals = { passed: 0, failed: 0, skipped: 0, pending: 0 };
    const summary = [];
    const lines = ['', this.paint('  GO NO-GO  /  TEST REPORT', 'title'), this.paint('  Tutti i test, raggruppati per file', 'dim')];
    let index = 0;
    for (const module of [...modules].sort((a, b) => a.relativeModuleId.localeCompare(b.relativeModuleId))) {
      const tests = [...module.children.allTests()];
      const counts = { passed: 0, failed: 0, skipped: 0, pending: 0 };
      const rows = tests.map(test => {
        const state = test.result().state;
        counts[state]++;
        totals[state]++;
        return [this.paint(++index, 'dim'), this.paint(labels[state] || state, tones[state]),
          this.paint(duration(test.diagnostic()?.duration), 'dim'), this.paint(test.fullName, tones[state] || 'dim')];
      });
      if (rows.length) {
        lines.push('', this.paint(`  ${module.relativeModuleId}`, 'heading'),
          ...this.table(['#', 'Esito', 'Tempo', 'Suite > Test'], rows, [4, 6, 10, nameWidth], { numeric: [0, 2] }));
      }
      summary.push([this.paint(module.relativeModuleId, module.ok() ? 'green' : 'red'), String(tests.length),
        this.paint(counts.passed), this.paint(counts.failed, counts.failed ? 'red' : 'dim'),
        this.paint(counts.skipped, counts.skipped ? 'yellow' : 'dim'), this.paint(counts.pending, counts.pending ? 'yellow' : 'dim'),
        duration(module.diagnostic().duration)]);
    }

    const executed = totals.passed + totals.failed;
    const rate = executed ? totals.passed / executed : 0;
    const filled = Math.round(rate * 24);
    const failedFiles = modules.filter(module => !module.ok()).length;
    const failed = reason !== 'passed' || totals.failed > 0 || failedFiles > 0 || unhandledErrors.length > 0;
    const title = failed ? 'NO-GO  /  CONTROLLARE GLI ERRORI' : !executed || totals.pending ? 'VERIFICA INCOMPLETA' : 'GO  /  TUTTI I TEST ESEGUITI SUPERATI';
    const tone = failed ? 'red' : !executed || totals.pending ? 'yellow' : 'title';
    lines.push('', this.paint('  RIEPILOGO FINALE', 'title'),
      ...this.table(['File', 'Test', 'PASS', 'FAIL', 'SKIP', 'ATTESA', 'Tempo'], summary,
        [Math.max(18, Math.min(48, columns - 70)), 5, 5, 5, 5, 6, 10], {
          numeric: [1, 2, 3, 4, 5, 6],
          footer: [this.paint('TOTALE', 'title'), this.paint(index, 'title'), this.paint(totals.passed, 'title'),
            this.paint(totals.failed, totals.failed ? 'red' : 'dim'), this.paint(totals.skipped, totals.skipped ? 'yellow' : 'dim'),
            this.paint(totals.pending, totals.pending ? 'yellow' : 'dim'), this.paint(duration(elapsed), 'title')]
        }), '', this.paint(`  ${title}`, tone),
      `  ${this.paint('█'.repeat(filled))}${this.paint('░'.repeat(24 - filled), 'dim')}  ${executed ? (rate * 100).toFixed(1) + '%' : '-'} di successo sui test eseguiti`,
      `  ${modules.length} file  ·  ${index} test elencati  ·  Durata reale: ${duration(elapsed)}`);
    if (failedFiles || unhandledErrors.length) lines.push(this.paint(`  File con errori: ${failedFiles}  ·  Errori non gestiti: ${unhandledErrors.length}`, 'red'));
    lines.push('');
    // Keep Vitest's default reporter for failure diagnostics and the process exit code.
    this.logger.log(lines.join('\n'));
  }
}
