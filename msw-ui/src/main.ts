import './style.css';

/* Data */

type RestHandlerInfo = { isActive: boolean; header: string; method: string; path: string };

const startApp = async () => {
  const res: { scenarios: Record<string, RestHandlerInfo | RestHandlerInfo[]> } = await fetch('/scenario').then(res =>
    res.json(),
  );

  const scenarios = res.scenarios;

  const scenariosPerHandler = Object.entries(scenarios)
    .filter(([_, handlers]) => !Array.isArray(handlers))
    // Group by endpoint (info.header)
    .reduce((acc, scenarios) => {
      const [scenarioName, info] = scenarios as [string, RestHandlerInfo];
      const key = info.header;
      const [method, path] = key.split(' ');
      if (!(key in acc)) {
        acc[key] = { method, path, scenarios: [] };
      }
      acc[key].scenarios.push({ active: info.isActive, label: scenarioName });

      return acc;
    }, {} as Record<string, { method: string; path: string; scenarios: { active: boolean; label: string }[] }>);

  const globalScenarios = Object.entries(scenarios).filter(([_, handlers]) => Array.isArray(handlers));

  const createButton = (label: string, isActive?: boolean) => {
    const button = document.createElement('button');
    if (isActive) {
      button.className = 'active';
    }
    button.innerText = label;
    button.addEventListener('click', async () => {
      await fetch('/scenario', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario: label }),
      });
      startApp();
    });
    return button;
  };

  /* Global scenarios */

  const div = document.querySelector<HTMLDivElement>('#global-scenarios')!;
  div.innerHTML = '';

  globalScenarios.forEach(([scenario]) => {
    const button = createButton(scenario);
    div.appendChild(button);
  });

  /* Scenarios per handler table */

  const createCell = (contents: string): HTMLTableDataCellElement => {
    var td = document.createElement('td');
    td.innerHTML = contents;
    return td;
  };

  const tbody = document.querySelector<HTMLTableSectionElement>('#scenarios-per-handler')!;
  tbody.innerHTML = '';

  Object.values(scenariosPerHandler).forEach(endpoint => {
    var tr = document.createElement('tr');

    const { method, path, scenarios } = endpoint;
    tr.appendChild(createCell(method));
    tr.appendChild(createCell(path));

    const td = document.createElement('td');
    scenarios.forEach(scenario => {
      td.appendChild(createButton(scenario.label, scenario.active));
    });
    tr.appendChild(td);

    tbody.appendChild(tr);
  });
};

startApp();
