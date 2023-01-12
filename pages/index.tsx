import { useState } from 'react';
import GenericHead from '../components/GenericHead';
import ProgressIndicator from '../components/ProgressIndicator';
import SerialController from '../components/SerialController';
import styles from '../styles/Home.module.scss';

import blinkExample from '../config/blink.json';
import oledExample from '../config/piicodev-oled.json';
import potentiometerExample from '../config/piicodev-potentiometer.json';

export default function Home() {

    const [pywriteJson, setPywriteJson] = useState('');
    const [progressIndicator, setProgressIndicator] = useState(<></>);

    return (
        <>
            <GenericHead />
            <main className={styles.main}>

                <header className={styles.header}>
                    <h1>Py-Write</h1>
                    <p>A web-application for Raspberry Pi Pico firmware updating via REPL by Bryce Tuppurainen</p>
                </header>
                <section className={styles.section}>


                    <textarea value={pywriteJson} cols={80} rows={20} className={styles.text} placeholder="Paste in, or write, a custom Py-Write .json file..." onChange={(e) => {
                        setPywriteJson(e.target.value);
                    }}></textarea>


                    {progressIndicator}

                    <select
                        className={styles.select}
                        onChange={
                            (e) => {
                                switch (e.target.value) {
                                    case 'blink':
                                        setPywriteJson(JSON.stringify(blinkExample, null, 4));
                                        return;
                                    case 'oled-example':
                                        setPywriteJson(JSON.stringify(oledExample, null, 4));
                                        return;
                                    case 'potentiometer-example':
                                        setPywriteJson(JSON.stringify(potentiometerExample, null, 4));
                                        return;
                                    default:
                                        setPywriteJson('');
                                        return;
                                }
                            }
                        }
                    >
                        <option value="custom" className={styles.option}>Paste in a Custom File</option>
                        <option value="blink" className={styles.option}>Blink onboard LED</option>
                        <optgroup label='Core Electronics - PiicoDev'>
                            <option value="oled-example">OLED Example</option>
                            <option value="potentiometer-example">Potentiometer Example</option>
                        </optgroup>
                    </select>



                    <input type="button" value={`Write!`} className={styles.button} onClick={
                        async () => {

                            let json: any = {};
                            try {
                                json = JSON.parse(pywriteJson);
                            } catch (error) {
                                console.log(error);
                            }

                            try {

                                const serialController = new SerialController();
                                await serialController.connect();

                                await serialController.wipeFiles();

                                const numberOfFiles = Object.keys(json).length;
                                let fileNumber = 0;
                                for (const filename in json) {
                                    fileNumber++;
                                    let content = '';
                                    if (json[filename].source) {
                                        content = await (await fetch(json[filename].source, { mode: 'cors' })).text();
                                    } else if (json[filename].content) {
                                        content = json[filename].content;
                                    } else {
                                        // TODO: it is a directory, do something here
                                        // Experimental Feature
                                    }
                                    if (content != '') {
                                        setProgressIndicator(<ProgressIndicator>
                                            {`In Progress - Writing ${filename} - File ${fileNumber} of ${numberOfFiles} `}</ProgressIndicator>);
                                        await serialController.writeTo(filename, content);
                                    }
                                }

                                await serialController.disconnect();
                                setProgressIndicator(<ProgressIndicator>Done</ProgressIndicator>);
                            } catch (error) {
                                console.log(error);
                                setProgressIndicator(<ProgressIndicator>Error</ProgressIndicator>)
                            }
                        }
                    } />

                    <input type="button" value="Wipe Files" className={styles.button} onClick={
                        async () => {
                            try {
                                const serialController = new SerialController();
                                await serialController.connect();
                                setProgressIndicator(<ProgressIndicator>In Progress - Wiping Files</ProgressIndicator>)
                                await serialController.wipeFiles();
                                await serialController.disconnect();
                                setProgressIndicator(<ProgressIndicator>Done</ProgressIndicator>)
                            } catch (error) {
                                console.log(error);
                                setProgressIndicator(<ProgressIndicator>Error</ProgressIndicator>)
                            }
                        }
                    } />

                    <input type="button" value="Run main" className={styles.button} onClick={
                        async () => {
                            try {
                                const serialController = new SerialController();
                                await serialController.connect();
                                setProgressIndicator(<ProgressIndicator>In Progress - Starting main.py</ProgressIndicator>)
                                await serialController.send('exec(open(\'main.py\').read())\r\n');
                                await serialController.disconnect();
                                setProgressIndicator(<ProgressIndicator>Done</ProgressIndicator>)
                            } catch (error) {
                                console.log(error);
                                setProgressIndicator(<ProgressIndicator>Error</ProgressIndicator>);
                            }
                        }
                    } />
                </section>
            </main>
        </>
    )
}