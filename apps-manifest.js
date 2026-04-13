// Manifest všech aplikací - stačí přidat nový objekt pro novou aplikaci
export const apps = [
    {
        id: 'copy-emoji',
        name: 'Copy Emoji',
        description: 'Klikni na emoji a zkopíruj ho do schránky',
        icon: '📋',
        component: () => import('./apps/copy-emoji.js')
    },
    {
        id: 'product-code',
        name: 'Product Code Generator',
        description: 'Generuj produktové kódy, SKU, EAN a další',
        icon: '🏷️',
        component: () => import('./apps/product-code.js')
    },
    {
    id: 'password-generator',
    name: 'Generátor hesel',
    description: 'Vytvoř si silné a bezpečné heslo',
    icon: '🔐',
    component: () => import('./apps/password-generator.js')
},
{
    id: 'bmi-calculator-new',
    name: 'BMI Kalkulačka',
    description: 'Spočítej si své BMI a sleduj zdraví',
    icon: '⚖️',
    component: () => import('./apps/bmi-calculator.js')
},
{
    id: 'duplicate-remover',
    name: 'Odstraňovač duplicit',
    description: 'Vyčisti seznam od duplicitních položek',
    icon: '🔄',
    component: () => import('./apps/duplicate-remover.js')
},
{
    id: 'text-compare',
    name: 'Porovnávač textu',
    description: 'Najdi rozdíly mezi dvěma texty',
    icon: '🔍',
    component: () => import('./apps/text-compare.js')
},
{
    id: 'percentage-calc',
    name: 'Procentní kalkulačka',
    description: 'Výpočet procent, slev a DPH',
    icon: '📊',
    component: () => import('./apps/percentage-calc.js')
},
{
    id: 'random-number',
    name: 'Náhodné číslo',
    description: 'Generátor náhodných čísel v libovolném rozsahu',
    icon: '🎲',
    component: () => import('./apps/random-number.js')
},
{
    id: 'color-picker',
    name: 'Color Picker',
    description: 'Výběr barvy a převod mezi formáty (HEX, RGB, HSL)',
    icon: '🎨',
    component: () => import('./apps/color-picker.js')
},
{
    id: 'random-picker',
    name: 'Náhodný výběr',
    description: 'Losuj a vybírej náhodné položky ze seznamu',
    icon: '🎲',
    component: () => import('./apps/random-picker.js')
},
{
    id: 'qr-generator',
    name: 'QR kód generátor',
    description: 'Vytvoř QR kód z textu, URL nebo kontaktu',
    icon: '📱',
    component: () => import('./apps/qr-generator.js')
},
{
    id: 'diacritic-remover',
    name: 'Odstranění diakritiky',
    description: 'Převeď text s diakritikou na prostý text',
    icon: '🔤',
    component: () => import('./apps/diacritic-remover.js')
},
{
    id: 'dice-roller',
    name: 'Házení kostkou',
    description: 'Klasická kostka nebo vlastní rozsah',
    icon: '🎲',
    component: () => import('./apps/dice-roller.js')
},
{
    id: 'unit-converter',
    name: 'Převodník jednotek',
    description: 'Převod délek, hmotností, objemů a teplot',
    icon: '📏',
    component: () => import('./apps/unit-converter.js')
},
{
    id: 'fuel-calculator',
    name: 'Kalkulačka spotřeby',
    description: 'Spočítej cenu za cestu a spotřebu paliva',
    icon: '⛽',
    component: () => import('./apps/fuel-calculator.js')
},
{
    id: 'age-calculator',
    name: 'Kalkulačka věku',
    description: 'Zjisti přesný věk z data narození',
    icon: '🎂',
    component: () => import('./apps/age-calculator.js')
},
{
    id: 'bill-splitter',
    name: 'Rozdělení účtu',
    description: 'Spravedlivě rozděl útratu mezi přátele',
    icon: '💰',
    component: () => import('./apps/bill-splitter.js')
},
{
    id: 'activity-generator',
    name: 'Co dnes dělat?',
    description: 'Náhodný generátor aktivit podle nálady',
    icon: '🤔',
    component: () => import('./apps/activity-generator.js')
},
{
    id: 'timer',
    name: 'Stopky / Časovač',
    description: 'Měř čas nebo nastav odpočet',
    icon: '⏱️',
    component: () => import('./apps/timer.js')
},
{
    id: 'percentage-randomizer',
    name: 'Kolik % něco jsi?',
    description: 'Zábavný randomizer procent podle kategorií',
    icon: '🎲',
    component: () => import('./apps/percentage-randomizer.js')
},
{
    id: 'savings-calculator',
    name: 'Kolik ušetřím?',
    description: 'Spočítej si úspory při odvykání',
    icon: '💰',
    component: () => import('./apps/savings-calculator.js')
},
{
    id: 'time-money',
    name: 'Čas za peníze',
    description: 'Kolik života vyměníš za nákup?',
    icon: '⏰',
    component: () => import('./apps/time-money.js')  // ← kontrola názvu
},
{
    id: 'roman-numerals',
    name: 'Římské číslice',
    description: 'Převod mezi arabskými a římskými číslicemi',
    icon: '🔢',
    component: () => import('./apps/roman-numerals.js')
},
{
    id: 'bmr-calculator',
    name: 'BMR Kalkulačka',
    description: 'Spočítej si bazální metabolismus a denní spotřebu',
    icon: '🩺',
    component: () => import('./apps/bmr-calculator.js')
},
{
    id: 'sheets-formatter-pro',
    name: 'Sheets Formatter',
    description: 'Naformátuj text pro snadné vložení do Google Sheets',
    icon: '📊',
    component: () => import('./apps/sheets-formatter-pro.js')
},
{
    id: 'link-separator',
    name: 'Link Separator',
    description: 'Extrahuj a rozděl URL adresy z textu',
    icon: '🔗',
    component: () => import('./apps/link-separator.js')
},
{
    id: 'data-chart',
    name: 'Graf vývoje',
    description: 'Vizualizace dat v jednoduchém sloupcovém grafu',
    icon: '📈',
    component: () => import('./apps/data-chart.js')
},
{
    id: 'simple-calculator',
    name: 'Kalkulačka',
    description: 'Základní početní operace',
    icon: '🧮',
    component: () => import('./apps/simple-calculator.js')
},
{
    id: 'find-replace',
    name: 'Find & Replace',
    description: 'Rychlé hledání a nahrazování v textu',
    icon: '🔍',
    component: () => import('./apps/find-replace.js')
},
{
    id: 'email-extractor',
    name: 'Email Extractor',
    description: 'Extrahuj emailové adresy z textu',
    icon: '📧',
    component: () => import('./apps/email-extractor.js')
},
{
    id: 'hashtag-generator',
    name: 'Hashtag generátor',
    description: 'Vytvoř hashtagy z textu pro sociální sítě',
    icon: '#️⃣',
    component: () => import('./apps/hashtag-generator.js')
},
{
    id: 'cooking-calculator',
    name: 'Kalkulačka vaření',
    description: 'Přepočet surovin podle počtu porcí',
    icon: '🍳',
    component: () => import('./apps/cooking-calculator.js')
},
{
    id: 'vat-calculator',
    name: 'Kalkulačka DPH',
    description: 'Výpočet daně pro české sazby (21%, 12%, 0%)',
    icon: '🧾',
    component: () => import('./apps/vat-calculator.js')
},
{
    id: 'metronome',
    name: 'Metronom',
    description: 'Udržuj tempo pomocí pravidelného tikání',
    icon: '🎵',
    component: () => import('./apps/metronome.js')
},
{
    id: 'color-mixer',
    name: 'Míchadlo barev',
    description: 'Míchej barvy a sleduj výsledek',
    icon: '🎨',
    component: () => import('./apps/color-mixer.js')
},
{
    id: 'noise-meter',
    name: 'Měřič hluku',
    description: 'Měří okolní hluk pomocí mikrofonu',
    icon: '🎤',
    component: () => import('./apps/noise-meter.js')
},
{
    id: 'math-worksheet',
    name: 'Pětiminutovky',
    description: 'Generování matematických příkladů na +, -, ×, ÷',
    icon: '🧮',
    component: () => import('./apps/math-worksheet.js')
},
{
    id: 'addition-pyramid',
    name: 'Sčítací pyramidy',
    description: 'Doplň chybějící čísla v pyramidě',
    icon: '🔺',
    component: () => import('./apps/addition-pyramid.js')
},
{
    id: 'spelling-exercise',
    name: 'Doplňovačka I/Y',
    description: 'Vytvoř cvičení na vyjmenovaná slova',
    icon: '✏️',
    component: () => import('./apps/spelling-exercise.js')
},
{
    id: 'alphabet-sorter',
    name: 'Abecední seřazovač',
    description: 'Seřaď slova podle abecedy',
    icon: '🔤',
    component: () => import('./apps/alphabet-sorter.js')
},
{
    id: 'team-splitter',
    name: 'Rozřazovač do týmů',
    description: 'Spravedlivě rozděl lidi do skupin',
    icon: '👥',
    component: () => import('./apps/team-splitter.js')
},
{
    id: 'meta-tag-generator',
    name: 'Meta Tag Generator',
    description: 'Generuj meta tagy pro SEO a sociální sítě',
    icon: '🏷️',
    component: () => import('./apps/meta-tag-generator.js')
},
{
    id: 'wheel-of-fortune',
    name: 'Kolo štěstí',
    description: 'Náhodné losování jmen nebo položek',
    icon: '🎡',
    component: () => import('./apps/wheel-of-fortune.js')
},
{
    id: 'departure-planner-pro',
    name: 'Time Backplanner',
    description: 'Naplánuj si cestu s vlastními kroky (zastávky, příprava, rezervy)',
    icon: '🚗',
    component: () => import('./apps/departure-planner-pro.js')
},
{
    id: 'word-counter-pro',
    name: 'Počítadlo znaků',
    description: 'Analýza textu – znaky, slova, čitelnost, SEO',
    icon: '📝',
    component: () => import('./apps/word-counter-pro.js')
},
{
    id: 'clothing-size-pro',
    name: 'Převod velikostí',
    description: 'Převodník velikostí oblečení a bot včetně džínů',
    icon: '👕',
    component: () => import('./apps/clothing-size-pro.js')
},
{
    id: 'salary-calculator-pro',
    name: 'Hrubá / Čistá mzda',
    description: 'Převod hrubé a čisté mzdy pro ČR a DE',
    icon: '💰',
    component: () => import('./apps/salary-calculator-pro.js')
}
];

// Pro snadné přidávání nových aplikací - stačí zkopírovat tento objekt a vyplnit
export const appTemplate = {
    id: 'unique-id',           // unikátní identifikátor
    name: 'Název aplikace',     // zobrazený název
    description: 'Popis aplikace', // krátký popis
    icon: '🛠️',                // emoji ikona
    component: () => import('./apps/nazev-souboru.js') // cesta k JS souboru
};