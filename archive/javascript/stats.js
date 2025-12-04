import axios from 'axios';

const baseUrl = 'https://api.mangadex.org';

const mangaID = '0301208d-258a-444a-8ef7-66e433d801b1';

const resp = await axios({
    method: 'GET',
    url: `${baseUrl}/statistics/manga/${mangaID}`
});

const { rating, follows } = resp.data.statistics[mangaID];

console.log(
    'Mean Rating:', rating.average, '\n' +
    'Bayesian Rating:', rating.bayesian, '\n' +
    'Follows:', follows
);