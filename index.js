import fetch from "node-fetch";
import fs from "fs";
import chalk from "chalk";

const displayHeader = () => {
  console.log(chalk.blueBright("==================================="));
  console.log(
    chalk.yellow("🌟   ") +
      chalk.greenBright("Shaga Auto Spin") +
      chalk.yellow("   🌟")
  );
  console.log(
    chalk.yellow("🤖   ") +
      chalk.magentaBright("Jems Bot") +
      chalk.yellow("   🤖")
  );
  console.log(chalk.cyan("\n🚀 Memulai proses spin untuk semua akun...\n"));
  console.log(chalk.green("💻 Recode boleh Asal Sertakan Credit😊😊"));
  console.log(chalk.blueBright("==================================="));
};

const readAccountsAndSpin = async () => {
  displayHeader();

  const accounts = fs.readFileSync("accounts.txt", "utf-8").trim().split("\n");
  const spinPromises = accounts.map((account) => {
    const [token, uid] = account.split(":");
    if (token && uid) {
      return attemptSpinLoop(uid.trim(), token.trim());
    } else {
      console.error(chalk.red(`❌ Format tidak valid pada baris: ${account}`));
      return Promise.resolve();
    }
  });

  await Promise.all(spinPromises);
  console.log(chalk.green("\n✅ Semua akun telah selesai melakukan spin."));
};

const spin = (uid, token) =>
  new Promise((resolve, reject) => {
    fetch("https://api-iowa.shaga.xyz/quests/spin", {
      method: "POST",
      headers: {
        accept: "application/json, text/plain, */*",
        "accept-language": "en-US,en;q=0.9,id;q=0.8",
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
        origin: "https://glob.shaga.xyz",
        priority: "u=1, i",
        referer: "https://glob.shaga.xyz/",
        "sec-ch-ua":
          '"Chromium";v="130", "Google Chrome";v="130", "Not?A_Brand";v="99"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-site",
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
      },
      body: JSON.stringify({ uid }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        if (data.nextSpinDurationMs) {
          let remainingTime = data.nextSpinDurationMs;

          const intervalId = setInterval(() => {
            if (remainingTime <= 0) {
              clearInterval(intervalId);
              resolve();
            } else {
              remainingTime -= 1000;

              const totalSeconds = Math.floor(remainingTime / 1000);
              const hours = Math.floor(totalSeconds / 3600);
              const minutes = Math.floor((totalSeconds % 3600) / 60);
              const seconds = totalSeconds % 60;

              const formattedTime = `${String(hours).padStart(2, "0")}:${String(
                minutes
              ).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

              process.stdout.write(
                chalk.yellow(
                  `\r⏳ Cooldown aktif untuk UID ${uid}. Spin selanjutnya tersedia dalam: ${formattedTime}`
                )
              );
            }
          }, 1000);
        } else {
          console.log(
            chalk.green(`\n🎉 Spin berhasil untuk UID ${uid}:`),
            data
          );
          resolve(data);
        }
      })
      .catch((error) => {
        console.error(chalk.red(`❌ Error untuk UID ${uid}:`), error);
        reject(error);
      });
  });

const attemptSpinLoop = async (uid, token) => {
  try {
    await spin(uid, token);
    console.log(chalk.green(`\n✅ Spin selesai untuk UID ${uid}`));
  } catch (error) {
    console.error(chalk.red(`⚠️ Spin gagal untuk UID ${uid}:`), error);
    await new Promise((resolve) => setTimeout(resolve, 5000));
    await attemptSpinLoop(uid, token);
  }
};

readAccountsAndSpin();
