export const MOODS = [
  { value: 'happy', label: 'Happy', emoji: '😊' },
  { value: 'calm', label: 'Calm', emoji: '😌' },
  { value: 'energetic', label: 'Energetic', emoji: '⚡' },
  { value: 'sensitive', label: 'Sensitive', emoji: '🥹' },
  { value: 'anxious', label: 'Anxious', emoji: '😟' },
  { value: 'irritable', label: 'Irritable', emoji: '😤' },
  { value: 'sad', label: 'Sad', emoji: '😢' },
  { value: 'tired', label: 'Tired', emoji: '😴' },
]

export const FLOWS = [
  { value: 'spotting', label: 'Spotting' },
  { value: 'light', label: 'Light' },
  { value: 'medium', label: 'Medium' },
  { value: 'heavy', label: 'Heavy' },
]

export const CRAMP_LABELS = ['None', 'Very mild', 'Mild', 'Moderate', 'Strong', 'Severe']
export const ENERGY_LABELS = ['', 'Very low', 'Low', 'Okay', 'Good', 'High']

export const PHASES = {
  menstrual: {
    name: 'Menstrual phase',
    blurb: 'Your body is shedding the uterine lining. Rest and warmth help.',
    tip: 'Iron-rich foods like lentils, spinach and jaggery can help replace what you lose. A warm compress eases cramps.',
  },
  follicular: {
    name: 'Follicular phase',
    blurb: 'Estrogen is rising and energy often returns.',
    tip: 'Energy usually climbs now - a good time for workouts, new projects and social plans.',
  },
  ovulation: {
    name: 'Ovulation window',
    blurb: 'An egg is likely being released around now (estimated).',
    tip: 'Some people notice clearer cervical mucus, mild one-sided pain or higher energy. Stay hydrated.',
  },
  luteal: {
    name: 'Luteal phase',
    blurb: 'Progesterone rises; PMS symptoms may appear toward the end.',
    tip: 'Magnesium-rich foods (nuts, seeds, dark chocolate), steady sleep and gentle movement can soften PMS.',
  },
}

export const TIP_CATEGORIES = [
  { id: 'hygiene', label: 'Hygiene', emoji: '🧼' },
  { id: 'nutrition', label: 'Nutrition', emoji: '🥗' },
  { id: 'hydration', label: 'Hydration', emoji: '💧' },
  { id: 'selfcare', label: 'Self-care', emoji: '🌿' },
  { id: 'doctor', label: 'See a doctor', emoji: '🩺' },
]

export const TIPS = [
  { cat: 'hygiene', title: 'Change pads every 4-6 hours', body: 'Even on light days, regular changes reduce odour, irritation and infection risk.' },
  { cat: 'hygiene', title: 'Tampons: never longer than 8 hours', body: 'Use the lowest absorbency that works and change at least every 4-8 hours. Longer wear raises the (rare) risk of toxic shock syndrome. Avoid leaving one in overnight past 8 hours.' },
  { cat: 'hygiene', title: 'Menstrual cups & discs', body: 'Most can be worn up to 12 hours. Wash hands before inserting, empty and rinse regularly, and sterilise in boiling water between cycles.' },
  { cat: 'hygiene', title: 'Wash gently, only on the outside', body: 'Clean the vulva with plain warm water or a mild, unscented wash. The vagina cleans itself - avoid douching and scented products.' },
  { cat: 'hygiene', title: 'Wash hands before and after', body: 'Always wash your hands when changing products. Wrap used pads and bin them - never flush them.' },
  { cat: 'hygiene', title: 'Wear breathable underwear', body: 'Cotton underwear and a spare pair in your bag keep you comfortable and dry.' },
  { cat: 'nutrition', title: 'Top up on iron', body: 'Lentils, chickpeas, spinach, dates, jaggery, tofu and lean meat help replace iron lost in your period. Pair with vitamin C (lemon, oranges, amla) to absorb more.' },
  { cat: 'nutrition', title: 'Magnesium for cramps & mood', body: 'Nuts, seeds, bananas, oats and dark chocolate are good sources and may ease cramps and PMS.' },
  { cat: 'nutrition', title: 'Eat smaller, regular meals', body: 'Steady blood sugar helps mood and energy. Whole grains and protein keep you fuller than refined sugar.' },
  { cat: 'nutrition', title: 'Go easy on salt, caffeine & ultra-processed snacks', body: 'They can worsen bloating, breast tenderness and jitters for some people.' },
  { cat: 'nutrition', title: 'Omega-3s and ginger', body: 'Fatty fish, walnuts, flaxseed and ginger tea have anti-inflammatory properties that some find soothing.' },
  { cat: 'hydration', title: 'Drink water through the day', body: 'Aim for pale-yellow urine as a simple guide. Good hydration can reduce bloating and headaches.' },
  { cat: 'hydration', title: 'Warm drinks soothe', body: 'Warm water, ginger, chamomile or peppermint tea can be calming and help with cramps and nausea.' },
  { cat: 'hydration', title: 'Add water-rich foods', body: 'Cucumber, watermelon, oranges and soups help you stay hydrated while being gentle on the stomach.' },
  { cat: 'selfcare', title: 'Heat is your friend', body: 'A hot-water bottle or heating pad on your lower belly relaxes uterine muscles and eases cramps.' },
  { cat: 'selfcare', title: 'Move gently', body: 'Walking, stretching, yoga or swimming release endorphins and can reduce pain. Listen to your body - rest is valid too.' },
  { cat: 'selfcare', title: 'Prioritise sleep', body: 'Hormone shifts can disturb sleep. A regular bedtime, dim lights and fewer screens help.' },
  { cat: 'selfcare', title: 'Be kind to your moods', body: 'Mood swings are common and real. Journaling, talking to a friend or a quiet evening can help - tracking moods here shows your patterns.' },
  { cat: 'selfcare', title: 'Over-the-counter relief', body: 'Pain relievers such as ibuprofen can help cramps when taken as directed on the label. Check with a pharmacist or doctor if you have other conditions or take other medicines.' },
  { cat: 'doctor', title: 'Very heavy bleeding', body: 'Soaking through a pad or tampon every hour for several hours, passing large clots, or bleeding more than 7 days needs medical attention.' },
  { cat: 'doctor', title: 'Severe pain', body: 'Pain that stops you from daily activities or does not respond to usual relief should be checked - it can be linked to treatable conditions like endometriosis.' },
  { cat: 'doctor', title: 'Irregular or missing periods', body: 'See a doctor if cycles are regularly shorter than 21 or longer than 35 days, or you miss 3+ periods in a row (and are not pregnant).' },
  { cat: 'doctor', title: 'Fever or feeling unwell with a tampon', body: 'Sudden high fever, rash, dizziness or vomiting while using a tampon: remove it and seek emergency care immediately.' },
]

export const DISCLAIMER =
  'This app is for tracking and general wellbeing information only. It is not medical advice and its predictions are estimates - always speak to a healthcare professional about health concerns.'
