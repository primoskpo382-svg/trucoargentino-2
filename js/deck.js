// js/deck.js
const IMAGENES_ESPADAS = {
    '1E': '/casrtas/3B9CB9AE-9416-4AEE-9D93-DF7E2B5D25D8.png',
    '2E': '/casrtas/280DF667-8528-4D10-BAC1-3D3BEE723E21.png',
    '3E': '/casrtas/78E4021C-B66A-461F-9C0E-5A2735538D67.png',
    '4E': '/casrtas/757A2F70-FE42-4A1E-86BB-BBB4A48BF042.png',
    '5E': '/casrtas/32688BF2-F484-4EC5-8A1A-0BACFFC419C2.png',
    '6E': '/casrtas/F6EB3C3A-FF6B-4A16-A897-066D2EA5D252.png',
    '7E': '/casrtas/889FDC04-602F-4609-856C-466B356DDFF0.png',
    '10E': '/casrtas/D922D71F-DDE0-4F93-9A48-13C2C25BAE0A.png',
    '11E': '/casrtas/56CFB2BF-287E-427A-99F0-F70A20B2238A.png',
    '12E': '/casrtas/IMG_5814.JPG'
};

const IMAGENES_COPAS = {
    '1C': '/casrtas/0A6E7B15-5DF8-490D-95E6-6876FDF4C6EE.png',
    '2C': '/casrtas/65D989B8-48D9-4ED0-A9E9-39F4F07D2B1C.png',
    '3C': '/casrtas/D8876D6B-A6B0-4388-8B1C-7FD7E772843C.png',
    '4C': '/casrtas/45539003-D55D-4ED9-A77C-9CF91A986DBF.png',
    '5C': '/casrtas/F636396C-5FCA-408D-BE11-F5555E57F457.png',
    '6C': '/casrtas/D253ABD0-8E05-4E98-A868-D248C7B5F81D.png',
    '7C': '/casrtas/C090B8F3-4D08-43DD-AFBD-A54B336DF712.png',
    '10C': '/casrtas/D90F1F7A-8238-43D1-A6D2-564040C3D3E8.png',
    '11C': '/casrtas/C26265A6-680F-40B9-B25B-DAC0BDF3ADA1.png',
    '12C': '/casrtas/7F7C1D19-F1D2-4DC8-813C-FD9FD595167A.png'
};

const IMAGENES_BASTOS = {
    '1B': '/casrtas/IMG_7083.JPG',
    '2B': '/casrtas/IMG_7084.JPG',
    '3B': '/casrtas/IMG_7085.JPG',
    '4B': '/casrtas/IMG_7086.JPG',
    '5B': '/casrtas/IMG_7087.JPG',
    '6B': '/casrtas/IMG_7088.JPG',
    '7B': '/casrtas/IMG_7089.JPG',
    '10B': '/casrtas/IMG_7090.JPG',
    '11B': '/casrtas/IMG_7091.JPG',
    '12B': '/casrtas/IMG_7092.JPG'
};

const IMAGENES_OROS = {
    '1O': '/casrtas/IMG_7061.JPG',
    '2O': '/casrtas/IMG_7062.JPG',
    '3O': '/casrtas/IMG_7063.JPG',
    '4O': '/casrtas/IMG_7064.JPG',
    '5O': '/casrtas/IMG_7065.JPG',
    '6O': '/casrtas/IMG_7066.JPG',
    '7O': '/casrtas/IMG_7067.JPG',
    '10O': '/casrtas/IMG_7068.JPG',
    '11O': '/casrtas/IMG_7069.JPG',
    '12O': '/casrtas/IMG_7081.JPG'
};

const MAZO = [
    { id: '1E', txt: '1 Espada', num: '1', poder: 14, envido: 1, palo: 'E', img: IMAGENES_ESPADAS['1E'] },
    { id: '1B', txt: '1 Basto', num: '1', poder: 13, envido: 1, palo: 'B', img: IMAGENES_BASTOS['1B'] },
    { id: '7E', txt: '7 Espada', num: '7', poder: 12, envido: 7, palo: 'E', img: IMAGENES_ESPADAS['7E'] },
    { id: '7O', txt: '7 Oro', num: '7', poder: 11, envido: 7, palo: 'O', img: IMAGENES_OROS['7O'] },
    { id: '3E', txt: '3 Espada', num: '3', poder: 10, envido: 3, palo: 'E', img: IMAGENES_ESPADAS['3E'] },
    { id: '3B', txt: '3 Basto', num: '3', poder: 10, envido: 3, palo: 'B', img: IMAGENES_BASTOS['3B'] },
    { id: '3C', txt: '3 Copa', num: '3', poder: 10, envido: 3, palo: 'C', img: IMAGENES_COPAS['3C'] },
    { id: '3O', txt: '3 Oro', num: '3', poder: 10, envido: 3, palo: 'O', img: IMAGENES_OROS['3O'] },
    { id: '2E', txt: '2 Espada', num: '2', poder: 9, envido: 2, palo: 'E', img: IMAGENES_ESPADAS['2E'] },
    { id: '2B', txt: '2 Basto', num: '2', poder: 9, envido: 2, palo: 'B', img: IMAGENES_BASTOS['2B'] },
    { id: '2C', txt: '2 Copa', num: '2', poder: 9, envido: 2, palo: 'C', img: IMAGENES_COPAS['2C'] },
    { id: '2O', txt: '2 Oro', num: '2', poder: 9, envido: 2, palo: 'O', img: IMAGENES_OROS['2O'] },
    { id: '1C', txt: '1 Copa', num: '1', poder: 8, envido: 1, palo: 'C', img: IMAGENES_COPAS['1C'] },
    { id: '1O', txt: '1 Oro', num: '1', poder: 8, envido: 1, palo: 'O', img: IMAGENES_OROS['1O'] },
    { id: '12E', txt: '12 Espada', num: '12', poder: 7, envido: 0, palo: 'E', img: IMAGENES_ESPADAS['12E'] },
    { id: '12B', txt: '12 Basto', num: '12', poder: 7, envido: 0, palo: 'B', img: IMAGENES_BASTOS['12B'] },
    { id: '12C', txt: '12 Copa', num: '12', poder: 7, envido: 0, palo: 'C', img: IMAGENES_COPAS['12C'] },
    { id: '12O', txt: '12 Oro', num: '12', poder: 7, envido: 0, palo: 'O', img: IMAGENES_OROS['12O'] },
    { id: '11E', txt: '11 Espada', num: '11', poder: 6, envido: 0, palo: 'E', img: IMAGENES_ESPADAS['11E'] },
    { id: '11B', txt: '11 Basto', num: '11', poder: 6, envido: 0, palo: 'B', img: IMAGENES_BASTOS['11B'] },
    { id: '11C', txt: '11 Copa', num: '11', poder: 6, envido: 0, palo: 'C', img: IMAGENES_COPAS['11C'] },
    { id: '11O', txt: '11 Oro', num: '11', poder: 6, envido: 0, palo: 'O', img: IMAGENES_OROS['11O'] },
    { id: '10E', txt: '10 Espada', num: '10', poder: 5, envido: 0, palo: 'E', img: IMAGENES_ESPADAS['10E'] },
    { id: '10B', txt: '10 Basto', num: '10', poder: 5, envido: 0, palo: 'B', img: IMAGENES_BASTOS['10B'] },
    { id: '10C', txt: '10 Copa', num: '10', poder: 5, envido: 0, palo: 'C', img: IMAGENES_COPAS['10C'] },
    { id: '10O', txt: '10 Oro', num: '10', poder: 5, envido: 0, palo: 'O', img: IMAGENES_OROS['10O'] },
    { id: '7C', txt: '7 Copa', num: '7', poder: 4, envido: 7, palo: 'C', img: IMAGENES_COPAS['7C'] },
    { id: '7B', txt: '7 Basto', num: '7', poder: 4, envido: 7, palo: 'B', img: IMAGENES_BASTOS['7B'] },
    { id: '6E', txt: '6 Espada', num: '6', poder: 3, envido: 6, palo: 'E', img: IMAGENES_ESPADAS['6E'] },
    { id: '6B', txt: '6 Basto', num: '6', poder: 3, envido: 6, palo: 'B', img: IMAGENES_BASTOS['6B'] },
    { id: '6C', txt: '6 Copa', num: '6', poder: 3, envido: 6, palo: 'C', img: IMAGENES_COPAS['6C'] },
    { id: '6O', txt: '6 Oro', num: '6', poder: 3, envido: 6, palo: 'O', img: IMAGENES_OROS['6O'] },
    { id: '5E', txt: '5 Espada', num: '5', poder: 2, envido: 5, palo: 'E', img: IMAGENES_ESPADAS['5E'] },
    { id: '5B', txt: '5 Basto', num: '5', poder: 2, envido: 5, palo: 'B', img: IMAGENES_BASTOS['5B'] },
    { id: '5C', txt: '5 Copa', num: '5', poder: 2, envido: 5, palo: 'C', img: IMAGENES_COPAS['5C'] },
    { id: '5O', txt: '5 Oro', num: '5', poder: 2, envido: 5, palo: 'O', img: IMAGENES_OROS['5O'] },
    { id: '4E', txt: '4 Espada', num: '4', poder: 1, envido: 4, palo: 'E', img: IMAGENES_ESPADAS['4E'] },
    { id: '4B', txt: '4 Basto', num: '4', poder: 1, envido: 4, palo: 'B', img: IMAGENES_BASTOS['4B'] },
    { id: '4C', txt: '4 Copa', num: '4', poder: 1, envido: 4, palo: 'C', img: IMAGENES_COPAS['4C'] },
    { id: '4O', txt: '4 Oro', num: '4', poder: 1, envido: 4, palo: 'O', img: IMAGENES_OROS['4O'] }
];