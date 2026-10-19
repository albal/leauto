import type {
  Currency,
  EngagementType,
  IR35Status,
  Settings,
  Tone,
  WorkingPattern,
} from '../../settings/settings';
import { loadSettings, saveSettings } from '../../settings/store';

const form = document.querySelector<HTMLFormElement>('#settings')!;
const status = document.querySelector<HTMLElement>('#status')!;

function field<T extends HTMLElement = HTMLInputElement>(name: string): T {
  return form.elements.namedItem(name) as unknown as T;
}

function checkboxes(name: string): HTMLInputElement[] {
  return [...form.querySelectorAll<HTMLInputElement>(`input[name="${name}"]`)];
}

function setChecked(name: string, values: readonly string[]): void {
  for (const box of checkboxes(name)) box.checked = values.includes(box.value);
}

function checkedValues<T extends string>(name: string): T[] {
  return checkboxes(name)
    .filter((box) => box.checked)
    .map((box) => box.value as T);
}

function numberOrNull(name: string): number | null {
  const value = field(name).value.trim();
  return value === '' ? null : Number(value);
}

function fill(settings: Settings): void {
  setChecked('engagementTypes', settings.engagementTypes);
  field('ir35Enabled').checked = settings.ir35.enabled;
  setChecked('ir35Accepted', settings.ir35.accepted);
  setChecked('workingPatterns', settings.workingPatterns);
  field('maxOfficeDaysPerWeek').value = settings.hybrid.maxOfficeDaysPerWeek?.toString() ?? '';
  field<HTMLTextAreaElement>('cities').value = settings.hybrid.cities.join('\n');
  field<HTMLSelectElement>('currency').value = settings.rates.currency;
  field('preferredDayRate').value = settings.rates.preferredDayRate?.toString() ?? '';
  field('minimumDayRate').value = settings.rates.minimumDayRate?.toString() ?? '';
  field('hoursPerDay').value = settings.rates.hoursPerDay.toString();
  field('signOff').value = settings.signOff;
  field<HTMLSelectElement>('tone').value = settings.tone;
}

function read(previous: Settings): Settings {
  return {
    ...previous,
    setupComplete: true,
    engagementTypes: checkedValues<EngagementType>('engagementTypes'),
    ir35: { enabled: field('ir35Enabled').checked, accepted: checkedValues<IR35Status>('ir35Accepted') },
    workingPatterns: checkedValues<WorkingPattern>('workingPatterns'),
    hybrid: {
      maxOfficeDaysPerWeek: numberOrNull('maxOfficeDaysPerWeek'),
      cities: field<HTMLTextAreaElement>('cities')
        .value.split('\n')
        .map((city) => city.trim())
        .filter(Boolean),
    },
    rates: {
      currency: field<HTMLSelectElement>('currency').value as Currency,
      preferredDayRate: numberOrNull('preferredDayRate'),
      minimumDayRate: numberOrNull('minimumDayRate'),
      hoursPerDay: numberOrNull('hoursPerDay') ?? 7.5,
    },
    signOff: field('signOff').value.trim(),
    tone: field<HTMLSelectElement>('tone').value as Tone,
  };
}

function problems(settings: Settings): string[] {
  const found: string[] = [];
  if (!settings.engagementTypes.length) found.push('choose at least one Engagement Type');
  if (settings.ir35.enabled && !settings.ir35.accepted.length) found.push('choose at least one IR35 Status');
  if (!settings.workingPatterns.length) found.push('choose at least one Working Pattern');
  if (!settings.signOff) found.push('enter a sign-off name');
  return found;
}

function showStatus(message: string, isError = false): void {
  status.textContent = message;
  status.classList.toggle('error', isError);
}

const loaded = loadSettings().then((settings) => {
  fill(settings);
  return settings;
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const settings = read(await loaded);
  const found = problems(settings);
  if (found.length) {
    showStatus(`Before saving, ${found.join(', ')}.`, true);
    return;
  }
  await saveSettings(settings);
  showStatus('Saved.');
});
