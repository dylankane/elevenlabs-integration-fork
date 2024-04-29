require('dotenv').config();
const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Directory to save audio files
const audioDir = path.join(__dirname, 'audio');
if (!fs.existsSync(audioDir)){
    fs.mkdirSync(audioDir);
}

// Serve audio files from the 'audio' directory
app.use('/audio', express.static(audioDir));

// Error handling middleware
app.use((error, req, res, next) => {
    if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
        console.error(error);
        return res.status(400).send({ message: 'Malformed JSON in payload' });
    }
    next();
});

app.post('/synthesize', async (req, res) => {
    let text = req.body.text || null;

    if (!text) {
        res.status(400).send({ error: 'Text is required.' });
        return;
    }

    // Remove double quotes from text
    text = text.replace(/"/g, '');

    const voice = req.body.voice == 0 ? '21m00Tcm4TlvDq8ikWAM' : req.body.voice || '21m00Tcm4TlvDq8ikWAM';
    const model = req.body.model || 'eleven_multilingual_v2';
    const voice_settings = req.body.voice_settings == 0 ? { stability: 0.75, similarity_boost: 0.75 } : req.body.voice_settings || { stability: 0.75, similarity_boost: 0.75 };

    try {
        const response = await axios.post(
            `https://api.elevenlabs.io/v1/text-to-speech/${voice}`,
            {
                text: text.replace(/"/g, '\\"'), // escape inner double quotes
                voice_settings: voice_settings,
                model_id: model,
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    accept: 'audio/mpeg',
                    'xi-api-key': `${process.env.ELEVENLABS_API_KEY}`,
                },
                responseType: 'arraybuffer',
            }
        );

        const audioBuffer = Buffer.from(response.data, 'binary');

        // Save the audio file
        const audioFileName = `audio-${Date.now()}.mp3`;
        const audioFilePath = path.join(audioDir, audioFileName);
        fs.writeFileSync(audioFilePath, audioBuffer);

        // Generate URL for the audio file
        const audioFileUrl = `${req.protocol}://${req.get('host')}/audio/${audioFileName}`;
        res.send({ audioFileUrl });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error occurred while processing the request.');
    }
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});


// require('dotenv').config()
// const express = require('express')
// const axios = require('axios')
// const app = express()
// const port = process.env.PORT || 3000
// app.use(express.urlencoded({ extended: true }))
// app.use(express.json())

// app.use((error, req, res, next) => {
//   if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
//     console.error(error);
//     return res.status(400).send({ message: 'Malformed JSON in payload' })
//   }
//   next()
// })

// app.post('/synthesize', async (req, res) => {
//   let text = req.body.text || null

//   // Updated this based on Elias feedback
//   // As this change will allow the user to pass 0 as a value, if no text is set in the text variable,
//   // text will be 0 and the condition will be false so "0" will be used to do TTS.

//   // Previous condition
//   // if (text === undefined || text === null || text === '' || text == 0) {

//   if (!text) {
//     res.status(400).send({ error: 'Text is required.' })
//     return
//   }

//   // Remove double quotes from text
//   text = text.replace(/"/g, '')

//   const voice =
//     req.body.voice == 0
//       ? '21m00Tcm4TlvDq8ikWAM'
//       : req.body.voice || '21m00Tcm4TlvDq8ikWAM'

//   const model = req.body.model || 'eleven_multilingual_v2'

//   const voice_settings =
//     req.body.voice_settings == 0
//       ? {
//           stability: 0.75,
//           similarity_boost: 0.75,
//         }
//       : req.body.voice_settings || {
//           stability: 0.75,
//           similarity_boost: 0.75,
//         }

//   try {
//     const response = await axios.post(
//       `https://api.elevenlabs.io/v1/text-to-speech/${voice}`,
//       {
//         text: text.replace(/"/g, '\\"'), // escape inner double quotes ,
//         voice_settings: voice_settings,
//         model_id: model,
//       },
//       {
//         headers: {
//           'Content-Type': 'application/json',
//           accept: 'audio/mpeg',
//           'xi-api-key': `${process.env.ELEVENLABS_API_KEY}`,
//         },
//         responseType: 'arraybuffer',
//       }
//     )

//     const audioBuffer = Buffer.from(response.data, 'binary')
//     const base64Audio = audioBuffer.toString('base64')
//     const audioDataURI = `data:audio/mpeg;base64,${base64Audio}`
//     // console.log('Audio Data URI:', audioDataURI); // Log the full Data URI
//     res.send({ audioDataURI })
//   } catch (error) {
//     console.error(error)
//     res.status(500).send('Error occurred while processing the request.')
//   }
// })



// app.listen(port, () => {
//   console.log(`Server is running at http://localhost:${port}`)
// })
