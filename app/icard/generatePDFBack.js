import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system";
import backcardFlower from "../../assets/images/backcardflower.png";
import { quotes } from "./quotes";

export const generatePDFBack = async (inputs) => {
  try {
    // Load the backcard image asset
    const backcardFlowerAsset = Asset.fromModule(backcardFlower);
    await backcardFlowerAsset.downloadAsync();

    // Convert the backcard image to Base64
    const backcardFlowerBase64 = await FileSystem.readAsStringAsync(
      backcardFlowerAsset.localUri,
      {
        encoding: FileSystem.EncodingType.Base64,
      }
    );

    // Ensure the inputs array always has at least 10 entries
    const icardInputs = [
      ...inputs,
      ...Array.from({ length: 10 - inputs.length }, () => ({ name: "" })),
    ];

    // Define the HTML content for the PDF
    const htmlContent = `
    <html>
      <head>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Amaranth:ital,wght@0,400;0,700;1,400;1,700&family=Outfit:wght@100..900&display=swap');
    
          body {
            font-family: 'Amaranth', sans-serif;
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            width: 21cm;
            height: 29.7cm;
            background-color: #fff;
            overflow: hidden;
          }
    
          .container {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            align-items: center;
            width: 19.5cm;
            height: 27cm; 
            margin: auto;
            padding: 0;
          }
    
          .icard {
            width: 8.5cm;
            height: 5.5cm;
            border: 1px solid rgb(0, 0, 0);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            position: relative;
            text-align: center;
            page-break-inside: avoid;
            padding: 0 10px;
          }

          .icard::before {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-image: url('data:image/png;base64,${backcardFlowerBase64}');
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
            opacity: 0.5;
            z-index: -1; /* Ensures the image stays behind the text */
          }
    
          h2 {
            margin: 0;
            font-size: 18px;
            color: #000;
            z-index: 1; /* Ensures text stays on top of the background */
          }
        </style>
      </head>
      <body>
        <div class="container">
          ${icardInputs
            .map(
              (_, index) => `
                <div class="icard">
                  <h2>${quotes[index % quotes.length]}</h2>
                </div>
              `
            )
            .join("")}
        </div>
      </body>
    </html>
    `;

    // Generate and share the PDF
    const { uri } = await Print.printToFileAsync({
      html: htmlContent,
      width: 595.28, // A4 width in points
      height: 841.89, // A4 height in points
    });

    if (uri) {
      await Sharing.shareAsync(uri);
    }
  } catch (error) {
    console.error("Error generating PDF Back:", error);
    alert(`Error: ${error.message || "An unknown error occurred."}`);
  }
};
