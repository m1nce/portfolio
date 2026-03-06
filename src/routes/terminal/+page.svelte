<script>
  import { onMount } from 'svelte';
  import { projects } from '$lib/data/projects.js';
  import { experiences } from '$lib/data/experience.js';

  let history = [];
  let input = '';
  let cmdHistory = [];
  let cmdIndex = -1;
  let outputEl;
  let inputEl;

  // email wizard state
  let emailState = null; // null | 'subject' | 'body'
  let emailSubject = '';

  $: promptPrefix = emailState === 'subject' ? 'subject  >'
                  : emailState === 'body'    ? 'message  >'
                  : 'minchan@portfolio:~$';

  const WELCOME = `
╔═══════════════════════════════════════════╗
║         minchan@portfolio  ~              ║
║         HCI · Time-Series ML              ║
╚═══════════════════════════════════════════╝

Type 'help' to see available commands.`;

  const COMMANDS = {
    help: () => `Available commands:

  whoami        — short bio
  ls            — list sections
  cat projects  — view all projects
  cat experience — view experience
  cat skills    — view skills
  email         — draft an email to me
  github        — open GitHub profile
  linkedin      — open LinkedIn profile
  date          — current date/time
  echo <text>   — echo text back
  clear         — clear terminal
  help          — show this message`,

    whoami: () => `Minchan Kim — undergraduate at MIT studying Computer Science
with a focus on Human-Computer Interaction and Machine Learning.

My work sits at the intersection of how people make sense of complex
temporal data and how AI systems can be designed to support — rather
than replace — human judgment. Especially interested in annotation
interfaces where domain experts and ML models collaborate to build
more reliable ground truth.`,

    ls: () => `projects/
experience/
skills/`,

    date: () => new Date().toString(),

    github: () => {
      if (typeof window !== 'undefined') window.open('https://github.com/m1nce', '_blank');
      return 'Opening https://github.com/m1nce ...';
    },

    linkedin: () => {
      if (typeof window !== 'undefined') window.open('https://linkedin.com/in/minchankim', '_blank');
      return 'Opening https://linkedin.com/in/minchankim ...';
    },

    email: () => {
      emailState = 'subject';
      return `Drafting email to mcskim04@gmail.com
──────────────────────────────────
Type "cancel" at any prompt to abort.

Subject:`;
    },
  };

  function handleEmailWizard(val) {
    const text = val.trim();

    if (text.toLowerCase() === 'cancel') {
      history = [...history, { type: 'input', prompt: promptPrefix, text: val }];
      emailState = null;
      emailSubject = '';
      history = [...history, { type: 'output', text: 'Email cancelled.' }];
      return;
    }

    if (emailState === 'subject') {
      history = [...history, { type: 'input', prompt: promptPrefix, text: val }];
      if (!text) {
        history = [...history, { type: 'output', text: 'Subject cannot be empty:' }];
        return;
      }
      emailSubject = text;
      emailState = 'body';
      history = [...history, { type: 'output', text: 'Message:' }];

    } else if (emailState === 'body') {
      history = [...history, { type: 'input', prompt: promptPrefix, text: val }];
      if (!text) {
        history = [...history, { type: 'output', text: 'Message cannot be empty:' }];
        return;
      }
      const sub = emailSubject;
      emailState = null;
      emailSubject = '';
      const href = `mailto:mcskim04@gmail.com?subject=${encodeURIComponent(sub)}&body=${encodeURIComponent(text)}`;
      window.location.href = href;
      history = [...history, { type: 'output', text: `Opening email client...
  To:      mcskim04@gmail.com
  Subject: ${sub}` }];
    }
  }

  function catCommand(arg) {
    if (arg === 'projects') {
      return projects.map((p, i) =>
        `[${i + 1}] ${p.title}\n    ${p.description}\n    Tags: ${p.tags.join(', ')}\n    Link: ${p.link}`
      ).join('\n\n');
    }
    if (arg === 'experience') {
      return experiences.map(e =>
        `${e.role} @ ${e.org}\n    ${e.dates}  [${e.type}]\n    ${e.description}`
      ).join('\n\n');
    }
    if (arg === 'skills') {
      return `Languages:  Python, JavaScript/TypeScript, C/C++, SQL, Java
Frameworks: SvelteKit, React, PyTorch, D3.js, Pandas, NumPy
Tools:      Git, Docker, Linux, Figma, LaTeX
Research:   HCI Methods, User Studies, Time-Series ML, LLMs`;
    }
    return `cat: ${arg}: No such file or directory`;
  }

  function runCommand(raw) {
    const trimmed = raw.trim();
    if (!trimmed) return;

    cmdHistory = [trimmed, ...cmdHistory];
    cmdIndex = -1;

    history = [...history, { type: 'input', text: trimmed }];

    if (trimmed === 'clear') {
      history = [];
      return;
    }

    let output;
    const [cmd, ...args] = trimmed.split(/\s+/);

    if (cmd === 'cat') {
      output = catCommand(args[0] ?? '');
    } else if (cmd === 'echo') {
      output = args.join(' ');
    } else if (COMMANDS[cmd]) {
      output = COMMANDS[cmd]();
    } else {
      output = `command not found: ${cmd}`;
    }

    history = [...history, { type: 'output', text: output }];
  }

  function handleKey(e) {
    if (e.key === 'Enter') {
      if (emailState) {
        handleEmailWizard(input);
      } else {
        runCommand(input);
      }
      input = '';
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (cmdIndex < cmdHistory.length - 1) {
        cmdIndex += 1;
        input = cmdHistory[cmdIndex];
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (cmdIndex > 0) {
        cmdIndex -= 1;
        input = cmdHistory[cmdIndex];
      } else {
        cmdIndex = -1;
        input = '';
      }
    }
  }

  $: if (outputEl && history) {
    setTimeout(() => { outputEl.scrollTop = outputEl.scrollHeight; }, 0);
  }

  onMount(() => {
    history = [{ type: 'output', text: WELCOME }];
    inputEl?.focus();
  });
</script>

<svelte:head>
  <title>Terminal — Minchan Kim</title>
</svelte:head>

<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
<div class="terminal-window" on:click={() => inputEl?.focus()}>
  <div class="terminal-output" bind:this={outputEl}>
    {#each history as entry}
      {#if entry.type === 'input'}
        <div class="line prompt">{entry.prompt ?? 'minchan@portfolio:~$'} {entry.text}</div>
      {:else}
        <pre class="line output">{entry.text}</pre>
      {/if}
    {/each}
  </div>

  <div class="terminal-input-row">
    <span class="prompt-prefix">{promptPrefix}</span>
    <input
      bind:this={inputEl}
      bind:value={input}
      on:keydown={handleKey}
      autocomplete="off"
      autocorrect="off"
      autocapitalize="off"
      spellcheck="false"
      aria-label="Terminal input"
    />
  </div>
</div>

<style>
  .terminal-window {
    display: flex;
    flex-direction: column;
    height: calc(100vh - 6rem);
    font-family: var(--font-mono);
    font-size: 0.85rem;
    background: var(--bg);
    cursor: text;
  }

  .terminal-output {
    flex: 1;
    overflow-y: auto;
    padding-bottom: 0.5rem;
  }

  .line {
    margin: 0;
    line-height: 1.6;
  }

  .line.prompt {
    color: var(--accent);
  }

  .line.output {
    color: var(--text-muted);
    white-space: pre-wrap;
    font-family: var(--font-mono);
  }

  .terminal-input-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    border-top: 1px solid var(--border);
    padding-top: 0.5rem;
  }

  .prompt-prefix {
    color: var(--accent);
    white-space: nowrap;
  }

  input {
    flex: 1;
    background: transparent;
    border: none;
    outline: none;
    color: var(--text);
    font: inherit;
    caret-color: var(--accent);
  }
</style>
