// এই ফাইলটি আপনার ক্যালেন্ডার ডেটা দিয়ে JSON ফাইল তৈরি করবে

const fs = require('fs'); // ফাইল সিস্টেমে কাজ করার জন্য Node.js মডিউল

// আপনার মূল ক্যালেন্ডারের অপরিবর্তিত কোড (ক্যালকুলেশন লজিক)
// -------------------------------------------------------------------
const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
const enDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
const hijriMonths = ["মুহাররম", "সফর", "রবিউল আউয়াল", "রবিউস সানি", "জমাদিউল আউয়াল", "জমাদিউস সানি", "রজব", "শাবান", "রমজান", "শাওয়াল", "জিলকদ", "জিলহজ"];
const gregorianMonths = ["জানুয়ারী", "ফেব্রুয়ারী", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];

const specialDays = {
    "0-1": "হিজরি নববর্ষ", "0-10": "পবিত্র আশুরা", "2-12": "পবিত্র ঈদে মিলাদুন্নবী", "3-11": "ফাতেহা-ই-ইয়াজদাহম", "6-27": "শবে মেরাজ",
    "7-15": "শবে বরাত", "8-27": "শবে কদর", "9-1": "ঈদুল ফিতর", "11-9": "আরাফার দিন বা পবিত্র হজ্জ", "11-10": "ঈদুল আযহা"
};

function toBangla(str) {
    return String(str).split('').map(char => enDigits.includes(char) ? bnDigits[enDigits.indexOf(char)] : char).join('');
}

function isLeapYear(year) {
    return [3, 6, 8].includes((year - 1) % 8 + 1);
}

function daysInHijriMonth(year, month) {
    if (month === 11) return isLeapYear(year) ? 30 : 29;
    return (month % 2 === 0) ? 30 : 29;
}

const HIJRI_BASE_UTC = Date.UTC(622, 6, 8);

function getApproxHijriDate(date = new Date()) {
    const msPerDay = 24 * 3600 * 1000;
    const givenUtc = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
    let diffDays = Math.floor((givenUtc - HIJRI_BASE_UTC) / msPerDay);
    let hYear = 1;
    while (true) {
        const yLen = isLeapYear(hYear) ? 355 : 354;
        if (diffDays < yLen) break;
        diffDays -= yLen; hYear++;
    }
    let hMonth = 0;
    while (hMonth < 12 && diffDays >= daysInHijriMonth(hYear, hMonth)) {
        diffDays -= daysInHijriMonth(hYear, hMonth); hMonth++;
    }
    const hDay = diffDays + 1;
    return { year: hYear, month: Math.min(11, Math.max(0, hMonth)), day: Math.min(30, Math.max(1, hDay)) };
}

function getGregorianDate(hijriYear, hijriMonth, hijriDay) {
    let totalDays = 0;
    for (let y = 1; y < hijriYear; y++) totalDays += isLeapYear(y) ? 355 : 354;
    for (let m = 0; m < hijriMonth; m++) totalDays += daysInHijriMonth(hijriYear, m);
    totalDays += (hijriDay - 1);
    const d = new Date(HIJRI_BASE_UTC + totalDays * 24 * 3600 * 1000);
    const resultDate = new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
    return resultDate.toISOString().split('T')[0]; // YYYY-MM-DD ফরম্যাট
}
// -------------------------------------------------------------------

// --- API ডেটা তৈরির মূল ফাংশন ---

function generateApiData() {
    console.log("API ডেটা জেনারেট করা শুরু হচ্ছে...");
    
    // ১. আজকের তারিখের জন্য একটি API এন্ডপয়েন্ট
    const today = new Date();
    const todayHijri = getApproxHijriDate(today);
    
    const todayData = {
        hijri: {
            day: todayHijri.day,
            month: {
                number: todayHijri.month + 1,
                name_bn: hijriMonths[todayHijri.month]
            },
            year: todayHijri.year,
            date_bn: `${toBangla(todayHijri.day)} ${hijriMonths[todayHijri.month]}, ${toBangla(todayHijri.year)}`
        },
        gregorian: {
            day: today.getDate(),
            month: {
                number: today.getMonth() + 1,
                name_bn: gregorianMonths[today.getMonth()]
            },
            year: today.getFullYear(),
            date_bn: `${toBangla(today.getDate())} ${gregorianMonths[today.getMonth()]}, ${toBangla(today.getFullYear())}`
        }
    };

    // ২. নির্দিষ্ট মাস বা বছরের ডেটা তৈরির জন্য
    const currentHijriYear = todayHijri.year;
    
    for (let year = currentHijriYear - 1; year <= currentHijriYear + 1; year++) { // বর্তমান, গত এবং আগামী বছরের ডেটা
        const yearData = {};
        for (let month = 0; month < 12; month++) {
            const monthDays = daysInHijriMonth(year, month);
            const monthData = {
                hijriYear: year,
                hijriMonth: month + 1,
                hijriMonthName: hijriMonths[month],
                totalDays: monthDays,
                days: []
            };
            for (let day = 1; day <= monthDays; day++) {
                monthData.days.push({
                    hijriDay: day,
                    gregorianDate: getGregorianDate(year, month, day),
                    specialDay: specialDays[`${month}-${day}`] || null
                });
            }
            yearData[month + 1] = monthData;
        }
        
        // বছরের ডেটা একটি ফাইলে সেভ করুন
        const yearDirPath = `./api/${year}`;
        if (!fs.existsSync(yearDirPath)) fs.mkdirSync(yearDirPath, { recursive: true });
        fs.writeFileSync(`${yearDirPath}/full.json`, JSON.stringify(yearData, null, 2));
    }


    // `api` নামে একটি ফোল্ডার তৈরি করুন যদি না থাকে
    if (!fs.existsSync('./api')) {
        fs.mkdirSync('./api');
    }
    
    // আজকের ডেটা `today.json` ফাইলে সেভ করুন
    fs.writeFileSync('./api/today.json', JSON.stringify(todayData, null, 2));

    console.log("API ডেটা সফলভাবে তৈরি হয়েছে! `api` ফোল্ডারটি দেখুন।");
}

generateApiData();