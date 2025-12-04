import axios from 'axios';
import readline from 'readline';


//console.log(access_token, refresh_token);
const baseUrl = 'https://api.mangadex.org';
const resp1 = await axios({
    method: 'GET',
    url: `${baseUrl}/manga/random?contentRating%5B%5D=safe&contentRating%5B%5D=suggestive&contentRating%5B%5D=erotica&includedTagsMode=AND&excludedTagsMode=OR`
});


const title = resp1.data.data.attributes.title.en;
console.log(title);

const id = resp1.data.data.id;
console.log(id);

const resp2 = await axios({
    method: 'GET',
    url: `${baseUrl}/manga/${id}/feed`
});

const chapters = resp2.data.data;
console.log(chapters);


chapters.forEach((item, index) => {
    console.log(`${index}: ${item.id}`);
});

var pass = false;


if (chapters.length > 1){
    const randomChapter = Math.floor(Math.random() * chapters.length);
    const resp3 = await axios({
        method: 'GET',
        url: `${baseUrl}/at-home/server/${chapters[randomChapter].id}`
    });
    console.log(resp3.data.dataSaver);
    pass = true;
} else if (chapters.length == 1){
    console.log('oneshot');
    const resp3 = await axios({
        method: 'GET',
        url: `${baseUrl}/at-home/server/${chapters[0].id}`
    });
    console.log(resp3.data.dataSaver);
    pass = true;
} else{
    console.log("no pages");
    pass = false;
}



if (pass == true){
    
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
    console.log(`Title ${title}`);// Ask a question
    rl.question('What you think this manga is? ', (answer) => {
      // Check if the answer is correct
      if (answer.trim() === title) {
        console.log('Correct!');
      } else {
        console.log('Incorrect. The correct answer is ' + title);
      }
    
      // Close the readline interface
      rl.close();
    });
}