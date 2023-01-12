export default class SerialController {
    private baudRate: number = 115200;

    private encoder: TextEncoder = new TextEncoder();
    private decoder: TextDecoder = new TextDecoder();

    private reader!: ReadableStreamDefaultReader;
    private writer!: WritableStreamDefaultWriter;

    // @ts-ignore serial is a new and experimental feature
    private port: SerialPort;

    SerialController() {
    }

    public isConnected = () => {
        if (this.port) {
            return this.port.readable && this.port.writable;
        }
        return false;
    }

    public connect = async (baudRate?: number) => {
        if (baudRate) {
            this.baudRate = baudRate;
        }
        try {
            // @ts-ignore serial is a new and experimental feature
            this.port = await navigator.serial.requestPort();
            await this.port.open({ baudRate: this.baudRate });
        } catch (error) {
            console.log('Error connecting to serial port!');
            console.log(error);
            return this.isConnected();
        }
        this.reader = await this.port.readable.getReader();
        this.writer = await this.port.writable.getWriter();

        await this.writer?.ready;

        console.log('Connected!');

        this.send(String.fromCharCode(3));

        return true;
    }

    public disconnect = async () => {
        if (this.port) {
            try {
                this.reader.releaseLock();
                this.writer.releaseLock();
                await this.port.close();
            } catch (error) {
                console.log('Error disconnecting from serial port!');
                console.log(error);
            }
        } else {
            console.log('No serial port to disconnect from!');
        }
        console.log('Disconnecting from serial port!');
    }

    public send = async (data: string, reply: boolean = false) => {
        await this.writer!.write(this.encoder.encode(data));

        if (reply) {
            const read = await this.read();
            return read;
        }

    }

    public read = async () => {
        return new Promise(async (resolve) => {
            let message: string = '';
            let available = true;
            while (available) {
                const promise = Promise.race(
                    [this.reader!.read(), new Promise((resolve) => setTimeout(resolve, 100))]
                )

                try {
                    const { value, done } = await promise as any;
                    if (this.decoder.decode(value) === '[K') {
                        resolve('Backspace');
                    }
                    available = done;
                    message += this.decoder.decode(value);
                } catch (error) {
                    console.log(error);

                    console.log('Timeout reading from serial port!');
                    resolve('TIMEOUT');
                    return;
                }
            }
            resolve(message);
        });
    }

    public writeTo = async (filename: string, content: string) => {

        content = content.replace(/\"/g, '\\\"');
        content = content.replace(/\\n/g, '\\\\n');
        content = content.replace(/\\r/g, '\\\\r');

        // Send a keyboard interrupt
        await this.send(String.fromCharCode(3), true);
        await this.send('\r\n\r\n\r\n', true);
        await this.send('import os\r\n', true);

        await this.send(`with open(\'${filename}\', \'w\') as f:\r\n`, true);
        await this.send(`f.write('') \r\n`, true);
        await this.send(`\b`, true);
        await this.send(`\r\n`, true);

        const lines = content.split('\n');

        for (const lineIndex in lines) {
            console.log(`Writing line ${lineIndex} of ${lines.length}`);

            await this.send(`with open(\'${filename}\', \'a\') as f:\r\n`, true);
            await this.send(`f.write(\"${lines[lineIndex]}\\n\")\r\n`, true);
            await this.send(`\b`, true);
            await this.send(`\r\n`);
            let response = '';

            // TODO: This is not the most efficient way to do this, simply fast to write
            while (!response.endsWith('> ') && response != 'TIMEOUT') {
                response = await this.read() as string;
            }
        }

    }

    public wipeFiles = async () => {
        await this.send('import os\r\n', true);
        await this.send('for file in os.listdir():\r\n', true);
        await this.send('    os.remove(file)\r\n', true);
        await this.send('\b', true);
        await this.send('\r\n\r\n\r\n', true);
    }

    public setBaudRate = (baudRate: number) => {
        this.baudRate = baudRate;
    }
}