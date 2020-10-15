// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-purple; icon-glyph: piggy-bank;
/************
* Scriptable code to get Balance from Starling Bank Account - Note: Developer account required
*/

// 1. Configure and format private API key

// Retrieve private key from keychain (note - this needs to be stored in keychain using key 'starling_key')

//let joe = Keychain.set('starling_key','<<<<Input_Starling_Personal_Key_here>>>>')


//Configure Colours dependent on Dark Mode and Normal
function colorConfig() {
    const tintLogo = false; // set to true to color the gitlab logo
    const tintColor = new Color('#FC6D26');
  
    const [bgColor, textColor] = isDarkMode
      ? // dark mode
        [new Color('#192851', 1), new Color('#FFF')]
      : // light mode
        [new Color('#ffffff', 1), new Color('#000000')];
  
    return {
      bgColor: bgColor,
      textColor: textColor,
      tintColor: tintColor,
      tintLogo: tintLogo,
    };
  }


const isDarkMode = Device.isUsingDarkAppearance(); // set this to true/false during debugging

if (config.runsInWidget) {
    const size = config.widgetFamily;
    const widget = await createWidget(size);
  
    Script.setWidget(widget);
    Script.complete();
  } else {
    // For debugging
    const size = 'small';
    //const size = 'medium'
    //const size = 'large'
    const widget = await createWidget(size);
    if (size == 'small') {
      widget.presentSmall();
    } else if (size == 'medium') {
      //widget.presentMedium();
      //Not implemented
    } else {
      //widget.presentLarge();
      //Not implemented
    }
    Script.complete();
  }

async function createWidget(size) {

    const colors = colorConfig();
    const widget = new ListWidget();
    const data = await fetchData();
    const footerFont = new Font("Helvetica",13)

    const starlingLogo = await getAsset('starling-logo')

    widget.backgroundColor = colors.bgColor;

      // small size
    if (size == 'small') {
        widget.setPadding(5, 0, 15, 0);
        const logo = widget.addImage(starlingLogo);
        logo.imageSize = new Size(80, 30);
        logo.leftAlignImage();
        if (colors.tintLogo) {
            logo.tintColor = colors.tintColor;
        }
        widget.addSpacer(4)
        let titleStack = widget.addStack()
        titleStack.cornerRadius = 4
        titleStack.setPadding(5, 5, 2, 5)
        let wtitle = titleStack.addText("Starling Balance: £" + insertDecimal(data))
        wtitle.font = Font.semiboldRoundedSystemFont(14)
        wtitle.textColor = colors.textColor
        widget.addSpacer(40)
        titleStack.addSpacer();

        let theFooter = widget.addText("Updated: " + await timehMMSS())
        theFooter.font = footerFont
        theFooter.textColor = colors.textColor

  }

  return widget;
}

//Retrieve Data from Starling Bank API and download balance from the PRIMARY Account
async function fetchData() {

    const secret = Keychain.get('starling_key')

    //Retrieve list of accounts and identify the accountUID for Primary Account
    const account_url = "https://api.starlingbank.com/api/v2/accounts"

    let req = new Request(account_url)
    req.headers = {'Authorization': 'Bearer ' + secret}
    let starling_account_results = await req.loadJSON()
    let accounts = starling_account_results.accounts
    let primary_account_id

    for (account of accounts)
    {
        if (account.accountType == 'PRIMARY'){
            primary_account_id = account.accountUid
        }
    }

    //Assuming successful download of accounts call the balance enquiry and store/return the effective_balance
    const balance_url = "https://api.starlingbank.com/api/v2/accounts/" + primary_account_id + "/balance"
    req = new Request(balance_url)
    req.headers = {'Authorization': 'Bearer ' + secret}
    let starling_balance_results = await req.loadJSON()
    let effective_balance = starling_balance_results.effectiveBalance
    return effective_balance.minorUnits;
}

//Balance comes back using minorUnits.  Add in missing decimal places
function insertDecimal(num) {
    return (num / 100).toFixed(2);
 }

 //Retrieve logos from the iCloud folder
 async function getAsset(name) {
    if (name == 'starling-logo') {
      if (isDarkMode) {
        name = 'starling_white.png';
      } else {
        name = 'starling.png';
      }
    }
    let fm = FileManager.iCloud();
    let dir = fm.documentsDirectory();
    let path = fm.joinPath(dir + '/starling-widget/assets', name);
    console.log(path)
    let download = await fm.downloadFileFromiCloud(path);
    let isDownloaded = await fm.isFileDownloaded(path);
  
    if (fm.fileExists(path)) {
      return fm.readImage(path);
    } else {
      console.log('Error: File does not exist.');
    }
  }
  

// ** Generates time output in specific format for bottom of Widget
async function timehMMSS() {
  var theDate = new Date() 
  return theDate.getHours() + ":" + ("0"+theDate.getMinutes()).slice(-2) + ":" + ("0"+theDate.getSeconds()).slice(-2)
}
