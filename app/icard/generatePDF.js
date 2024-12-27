import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system";
import mediBoy from "../../assets/images/medi-boy.png";
import mediGirl from "../../assets/images/medi-girl.png";
import aolLogo from "../../assets/images/aol-logo.png";

export const generatePDF = async (inputs) => {
  try {
    // Load the local image assets
    const mediBoyAsset = Asset.fromModule(mediBoy);
    const mediGirlAsset = Asset.fromModule(mediGirl);
    const aolLogoAsset = Asset.fromModule(aolLogo);

    await Promise.all([
      mediBoyAsset.downloadAsync(),
      mediGirlAsset.downloadAsync(),
      aolLogoAsset.downloadAsync(),
    ]);

    // Convert images to Base64
    const mediBoyBase64 = await FileSystem.readAsStringAsync(mediBoyAsset.localUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const mediGirlBase64 = await FileSystem.readAsStringAsync(mediGirlAsset.localUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const aolLogoBase64 = await FileSystem.readAsStringAsync(aolLogoAsset.localUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Ensure the inputs array always has at least 8 entries
    const icardInputs = [
      ...inputs,
      ...Array.from({ length: Math.ceil((10 - inputs.length) / 2) }, () => ({ name: "", gender: "Male" })),
      ...Array.from({ length: Math.floor((10 - inputs.length) / 2) }, () => ({ name: "", gender: "Female" })),
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
  width: 19.5cm; /* Slightly smaller than page width */
  height: 27cm;  /* Slightly smaller than page height */
  margin: auto;
  padding: 0;
}
    
          .icard {
            width: 8.5cm;
            height: 5.5cm;
            border: 1px solid #c0c0c0;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            position: relative;
            page-break-inside: avoid;
          }
    
          .aol-logo {
            position: absolute;
            top: 5px;
            left: 5px;
            width: 50px;
          }
    
          .icard img {
            width: 90px;
            height: auto;
          }
    
          h2 {
            margin: 0;
            font-size: 56px;
            color: #4a4a4a;
            text-shadow: 2px 2px 0 rgba(255, 126, 0, 0.75);
            min-height: 50px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
        </style>
      </head>
      <body>
        <div class="container">
          ${icardInputs
            .map(
              (input) => `
                <div class="icard">
                  <img class="aol-logo" src="data:image/png;base64,${aolLogoBase64}" alt="AOL Logo" />
                  <img 
                    src="data:image/png;base64,${
                      input.gender === "Female" ? mediGirlBase64 : mediBoyBase64
                    }" 
                    alt="${input.gender}" 
                  />
                  <h2>${input.name || "&nbsp;"}</h2>
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
    console.error("Error generating PDF:", error);
    alert(`Error: ${error.message || "An unknown error occurred."}`);
  }
};

