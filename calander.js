fetch('https://myappsbd.github.io/Permanenthijricalendar/api/today.json')
    .then(response => response.json())
    .then(data => {
        console.log("আজকের হিজরি তারিখ:", data.hijri.date_bn);
    })
    .catch(error => {
        console.error("API থেকে ডেটা আনতে সমস্যা হয়েছে:", error);
    });