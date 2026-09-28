// Finds the district (city) and division (state) in a free-text Bangladeshi
// address, so Meta can match on ct and st. The order form has no city field,
// so the address the customer typed, in Bengali or English, is all there is.

type District = { ct: string; st: string; aliases: string[] };

// ct and st are already normalised the way Meta expects them before hashing:
// lowercase roman letters, no spaces or punctuation.
const DISTRICTS: District[] = [
  // Dhaka division
  { ct: 'dhaka', st: 'dhaka', aliases: ['ঢাকা', 'dhaka'] },
  { ct: 'faridpur', st: 'dhaka', aliases: ['ফরিদপুর', 'faridpur'] },
  { ct: 'gazipur', st: 'dhaka', aliases: ['গাজীপুর', 'গাজিপুর', 'gazipur'] },
  { ct: 'gopalganj', st: 'dhaka', aliases: ['গোপালগঞ্জ', 'gopalganj'] },
  { ct: 'kishoreganj', st: 'dhaka', aliases: ['কিশোরগঞ্জ', 'kishoreganj', 'kishorganj'] },
  { ct: 'madaripur', st: 'dhaka', aliases: ['মাদারীপুর', 'মাদারিপুর', 'madaripur'] },
  { ct: 'manikganj', st: 'dhaka', aliases: ['মানিকগঞ্জ', 'manikganj'] },
  { ct: 'munshiganj', st: 'dhaka', aliases: ['মুন্সীগঞ্জ', 'মুন্সিগঞ্জ', 'munshiganj'] },
  { ct: 'narayanganj', st: 'dhaka', aliases: ['নারায়ণগঞ্জ', 'নারায়নগঞ্জ', 'narayanganj'] },
  { ct: 'narsingdi', st: 'dhaka', aliases: ['নরসিংদী', 'নরসিংদি', 'narsingdi', 'narshingdi'] },
  { ct: 'rajbari', st: 'dhaka', aliases: ['রাজবাড়ী', 'রাজবাড়ি', 'rajbari'] },
  { ct: 'shariatpur', st: 'dhaka', aliases: ['শরীয়তপুর', 'শরিয়তপুর', 'shariatpur'] },
  { ct: 'tangail', st: 'dhaka', aliases: ['টাঙ্গাইল', 'টাংগাইল', 'tangail'] },
  // Chattogram division
  { ct: 'bandarban', st: 'chattogram', aliases: ['বান্দরবান', 'bandarban'] },
  { ct: 'brahmanbaria', st: 'chattogram', aliases: ['ব্রাহ্মণবাড়িয়া', 'ব্রাহ্মনবাড়িয়া', 'brahmanbaria'] },
  { ct: 'chandpur', st: 'chattogram', aliases: ['চাঁদপুর', 'chandpur'] },
  { ct: 'chattogram', st: 'chattogram', aliases: ['চট্টগ্রাম', 'chattogram', 'chittagong', 'ctg'] },
  { ct: 'cumilla', st: 'chattogram', aliases: ['কুমিল্লা', 'cumilla', 'comilla'] },
  { ct: 'coxsbazar', st: 'chattogram', aliases: ['কক্সবাজার', 'coxsbazar', 'coxbazar'] },
  { ct: 'feni', st: 'chattogram', aliases: ['ফেনী', 'ফেনি', 'feni'] },
  { ct: 'khagrachari', st: 'chattogram', aliases: ['খাগড়াছড়ি', 'khagrachari', 'khagrachhari'] },
  { ct: 'lakshmipur', st: 'chattogram', aliases: ['লক্ষ্মীপুর', 'লক্ষীপুর', 'lakshmipur', 'laxmipur'] },
  { ct: 'noakhali', st: 'chattogram', aliases: ['নোয়াখালী', 'নোয়াখালি', 'noakhali'] },
  { ct: 'rangamati', st: 'chattogram', aliases: ['রাঙ্গামাটি', 'রাঙামাটি', 'rangamati'] },
  // Rajshahi division
  { ct: 'bogura', st: 'rajshahi', aliases: ['বগুড়া', 'bogura', 'bogra'] },
  { ct: 'joypurhat', st: 'rajshahi', aliases: ['জয়পুরহাট', 'joypurhat', 'jaipurhat'] },
  { ct: 'naogaon', st: 'rajshahi', aliases: ['নওগাঁ', 'naogaon'] },
  { ct: 'natore', st: 'rajshahi', aliases: ['নাটোর', 'natore'] },
  { ct: 'chapainawabganj', st: 'rajshahi', aliases: ['চাঁপাইনবাবগঞ্জ', 'চাঁপাই নবাবগঞ্জ', 'chapainawabganj', 'chapai nawabganj'] },
  { ct: 'pabna', st: 'rajshahi', aliases: ['পাবনা', 'pabna'] },
  { ct: 'rajshahi', st: 'rajshahi', aliases: ['রাজশাহী', 'রাজশাহি', 'rajshahi'] },
  { ct: 'sirajganj', st: 'rajshahi', aliases: ['সিরাজগঞ্জ', 'sirajganj'] },
  // Khulna division
  { ct: 'bagerhat', st: 'khulna', aliases: ['বাগেরহাট', 'bagerhat'] },
  { ct: 'chuadanga', st: 'khulna', aliases: ['চুয়াডাঙ্গা', 'চুয়াডাঙা', 'chuadanga'] },
  { ct: 'jashore', st: 'khulna', aliases: ['যশোর', 'jashore', 'jessore'] },
  { ct: 'jhenaidah', st: 'khulna', aliases: ['ঝিনাইদহ', 'jhenaidah', 'jhenaidaha'] },
  { ct: 'khulna', st: 'khulna', aliases: ['খুলনা', 'khulna'] },
  { ct: 'kushtia', st: 'khulna', aliases: ['কুষ্টিয়া', 'kushtia'] },
  { ct: 'magura', st: 'khulna', aliases: ['মাগুরা', 'magura'] },
  { ct: 'meherpur', st: 'khulna', aliases: ['মেহেরপুর', 'meherpur'] },
  { ct: 'narail', st: 'khulna', aliases: ['নড়াইল', 'narail'] },
  { ct: 'satkhira', st: 'khulna', aliases: ['সাতক্ষীরা', 'সাতক্ষিরা', 'satkhira'] },
  // Barishal division
  { ct: 'barguna', st: 'barishal', aliases: ['বরগুনা', 'barguna'] },
  { ct: 'barishal', st: 'barishal', aliases: ['বরিশাল', 'barishal', 'barisal'] },
  { ct: 'bhola', st: 'barishal', aliases: ['ভোলা', 'bhola'] },
  { ct: 'jhalokati', st: 'barishal', aliases: ['ঝালকাঠি', 'ঝালকাঠী', 'jhalokati', 'jhalakathi'] },
  { ct: 'patuakhali', st: 'barishal', aliases: ['পটুয়াখালী', 'পটুয়াখালি', 'patuakhali'] },
  { ct: 'pirojpur', st: 'barishal', aliases: ['পিরোজপুর', 'pirojpur'] },
  // Sylhet division
  { ct: 'habiganj', st: 'sylhet', aliases: ['হবিগঞ্জ', 'habiganj'] },
  { ct: 'moulvibazar', st: 'sylhet', aliases: ['মৌলভীবাজার', 'মৌলভিবাজার', 'moulvibazar', 'maulvibazar'] },
  { ct: 'sunamganj', st: 'sylhet', aliases: ['সুনামগঞ্জ', 'sunamganj'] },
  { ct: 'sylhet', st: 'sylhet', aliases: ['সিলেট', 'sylhet'] },
  // Rangpur division
  { ct: 'dinajpur', st: 'rangpur', aliases: ['দিনাজপুর', 'dinajpur'] },
  { ct: 'gaibandha', st: 'rangpur', aliases: ['গাইবান্ধা', 'gaibandha'] },
  { ct: 'kurigram', st: 'rangpur', aliases: ['কুড়িগ্রাম', 'kurigram'] },
  { ct: 'lalmonirhat', st: 'rangpur', aliases: ['লালমনিরহাট', 'lalmonirhat'] },
  { ct: 'nilphamari', st: 'rangpur', aliases: ['নীলফামারী', 'নীলফামারি', 'nilphamari'] },
  { ct: 'panchagarh', st: 'rangpur', aliases: ['পঞ্চগড়', 'panchagarh'] },
  { ct: 'rangpur', st: 'rangpur', aliases: ['রংপুর', 'rangpur'] },
  { ct: 'thakurgaon', st: 'rangpur', aliases: ['ঠাকুরগাঁও', 'ঠাকুরগাও', 'thakurgaon'] },
  // Mymensingh division
  { ct: 'jamalpur', st: 'mymensingh', aliases: ['জামালপুর', 'jamalpur'] },
  { ct: 'mymensingh', st: 'mymensingh', aliases: ['ময়মনসিংহ', 'mymensingh'] },
  { ct: 'netrokona', st: 'mymensingh', aliases: ['নেত্রকোনা', 'নেত্রকোণা', 'netrokona', 'netrakona'] },
  { ct: 'sherpur', st: 'mymensingh', aliases: ['শেরপুর', 'sherpur'] },
];

// Bengali letters such as ড় and য় can be typed as one code point or as a
// letter plus nukta. NFC turns both into the same sequence.
const normalise = (value: string) => value.normalize('NFC').toLowerCase();

// Latin aliases must stand as a whole word, and may be written with spaces or
// an apostrophe inside ("Cox's Bazar", "cox bazar"). Aliases are plain a-z, so
// nothing needs escaping. No lookbehind is used, because older iOS Safari
// versions throw on it.
const latinPattern = (alias: string) =>
  new RegExp(`(^|[^a-z])(${alias.split('').join("[\\s'’.-]*")})(?![a-z])`, 'g');

const MATCHERS = DISTRICTS.flatMap((district) =>
  district.aliases.map((raw) => {
    const alias = normalise(raw);
    const isLatin = /[a-z]/.test(alias);
    return { district, alias, pattern: isLatin ? latinPattern(alias.replace(/\s+/g, '')) : undefined };
  })
);

const lastIndexOf = (text: string, alias: string, pattern?: RegExp) => {
  if (!pattern) return text.lastIndexOf(alias);
  let index = -1;
  pattern.lastIndex = 0;
  for (let m = pattern.exec(text); m; m = pattern.exec(text)) {
    index = m.index + m[1].length;
  }
  return index;
};

/**
 * Returns the district mentioned last in the address, since Bangladeshi
 * addresses end with the district ("..., Mirpur, Dhaka"). Undefined when no
 * district name is found.
 */
export const findBdDistrict = (address: string): { ct: string; st: string } | undefined => {
  if (!address) return undefined;
  const text = normalise(address);

  let best: { district: District; index: number; length: number } | undefined;
  for (const { district, alias, pattern } of MATCHERS) {
    const index = lastIndexOf(text, alias, pattern);
    if (index < 0) continue;
    if (!best || index > best.index || (index === best.index && alias.length > best.length)) {
      best = { district, index, length: alias.length };
    }
  }
  return best ? { ct: best.district.ct, st: best.district.st } : undefined;
};
