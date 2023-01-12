import styles from "../styles/Home.module.scss";

export default function ProgressIndicator(props: { children: string }) {
    if (props.children.toLowerCase().includes('progress')) {
        return (
            <div className={styles.inProgressIndicator}>
                <p>{props.children} - Do not Disconnect Press F12 and see console for more information</p>
            </div>
        );
    } else if (props.children.toLowerCase().includes('done')) {

        return (
            <div className={styles.doneIndicator}>
                <p>{props.children} - Safe to Remove</p>
            </div>
        );
    }

    return (
        <div className={styles.errorIndicator}>
            <p>
                {props.children} - Disconnected
            </p>
        </div>
    );
}