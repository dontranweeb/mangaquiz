import axios from 'axios';


//console.log(access_token, refresh_token);
const baseUrl = 'https://api.mangadex.org';
const resp1 = await axios({
    method: 'GET',
    url: `${baseUrl}/chapter/9bdf19d6-20f2-4e88-b04f-7c8bfea83162?includes%5B%5D=scanlation_group`
});

//scan id from chapter
console.log(resp1.data.data);
const scan_id = resp1.data.data.relationships[0].id;
console.log(scan_id);


//scan name to thank
const scan_name = resp1.data.data.relationships[0].attributes.name;
console.log(scan_name);

//website//twiter
const resp2 = await axios({
    method: 'GET',
    url: `${baseUrl}/group/4b14373b-a533-4a08-a936-08d50b114799?includes%5B%5D=leader`
});

console.log(resp2.data.data.attributes.website);
console.log(resp2.data.data.attributes.twitter);