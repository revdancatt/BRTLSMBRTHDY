/* global preloadImagesTmr $fx fxhash fxrand noise paper1Loaded fxpreview Blob */

//
//  fxhash - BRTLSMBRTHDY
//
//
//  HELLO!! Code is copyright revdancatt (that's me), so no sneaky using it for your
//  NFT projects.
//  But please feel free to unpick it, and ask me questions. A quick note, this is written
//  as an artist, which is a slightly different (and more storytelling way) of writing
//  code, than if this was an engineering project. I've tried to keep it somewhat readable
//  rather than doing clever shortcuts, that are cool, but harder for people to understand.
//
//  You can find me at...
//  https://twitter.com/revdancatt
//  https://instagram.com/revdancatt
//  https://youtube.com/revdancatt
//

// Global values, because today I'm being an artist not an engineer!
const ratio = 1 // canvas ratio
const features = {} //  so we can keep track of what we're doing
const nextFrame = null // requestAnimationFrame, and the ability to clear it
let resizeTmr = null // a timer to make sure we don't resize too often
let highRes = false // display high or low res
let drawStarted = false // Flag if we have kicked off the draw loop
let thumbnailTaken = false
let forceDownloaded = false
const urlSearchParams = new URLSearchParams(window.location.search)
const urlParams = Object.fromEntries(urlSearchParams.entries())
const prefix = 'BRTLSMBRTHDY'
// dumpOutputs will be set to false unless we have ?dumpOutputs=true in the URL
const dumpOutputs = urlParams.dumpOutputs === 'true'
// const startTime = new Date().getTime()

let drawPaper = true

window.$fxhashFeatures = {}

const plot = {
  light: [],
  dark: [],
  red: [],
  green: [],
  blue: [],
  cyan: [],
  yellow: [],
  magenta: []
}
let plotted = false

// Some const colours
const RED = '#ea2530'
const GREEN = '#64b852'
const BLUE = '#3c539d'
const CYAN = '#6dcbdb'
const YELLOW = '#f2e643'
const MAGENTA = '#b64f98'
const RGBCYM = [RED, GREEN, BLUE, CYAN, MAGENTA, YELLOW]
const RGB = [RED, GREEN, BLUE]
const CYM = [CYAN, YELLOW, MAGENTA]

const hexToRgb = (hex) => {
  const result = /([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  }
}

const rgbToHsl = (rgb) => {
  rgb.r /= 255
  rgb.g /= 255
  rgb.b /= 255
  const max = Math.max(rgb.r, rgb.g, rgb.b)
  const min = Math.min(rgb.r, rgb.g, rgb.b)
  let h
  let s
  const l = (max + min) / 2

  if (max === min) {
    h = s = 0 // achromatic
  } else {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case rgb.r:
        h = (rgb.g - rgb.b) / d + (rgb.g < rgb.b ? 6 : 0)
        break
      case rgb.g:
        h = (rgb.b - rgb.r) / d + 2
        break
      case rgb.b:
        h = (rgb.r - rgb.g) / d + 4
        break
    }
    h /= 6
  }

  return {
    h: h * 360,
    s: s * 100,
    l: l * 100
  }
}

//  Work out what all our features are
const makeFeatures = () => {
  // features.background = 1
  features.paperOffset = {
    paper1: {
      x: fxrand(),
      y: fxrand()
    },
    paper2: {
      x: fxrand(),
      y: fxrand()
    }
  }

  /*
   *
   * Decide if we are going to have a background colour
   *
   */
  if (fxrand() < 0.2) {
    features.background = {
      colour: RGBCYM[Math.floor(fxrand() * RGBCYM.length)],
      mode: 'solid',
      edges: []
    }

    //  Now we need to make the top edge out of 200 points
    const maxPoints = 200
    //  We're going to make three edges
    for (let thisEdge = 0; thisEdge < 3; thisEdge++) {
      const edge = []
      const shuffleMod = (fxrand() + 1) * 50
      for (let i = 0; i < maxPoints; i++) {
        const newPoint = {
          x: i / (maxPoints - 1),
          y: 0
        }
        //  Adjust the y value based on the noise
        newPoint.y = noise.perlin3(newPoint.x * 100 * (thisEdge + 1), newPoint.y * thisEdge * 100 * (thisEdge + 1), i * 13000 * shuffleMod) * 0.005
        edge.push(newPoint)
      }
      // Now the right end
      for (let i = 0; i < maxPoints; i++) {
        const newPoint = {
          x: 1,
          y: i / (maxPoints - 1)
        }
        newPoint.x = noise.perlin3(newPoint.x * 100 * (thisEdge + 1), newPoint.y * thisEdge * 100 * (thisEdge + 1), i * 13000 * shuffleMod) * 0.005 + 1
        edge.push(newPoint)
      }
      // Now the bottom edge
      for (let i = 0; i < maxPoints; i++) {
        const newPoint = {
          x: 1 - (i / (maxPoints - 1)),
          y: 1
        }
        //  Adjust the y value based on the noise
        newPoint.y = noise.perlin3(newPoint.x * 100 * (thisEdge + 1), newPoint.y * thisEdge * 100 * (thisEdge + 1), i * 13000 * shuffleMod) * 0.005 + 1
        edge.push(newPoint)
      }
      // Now the left edge
      for (let i = 0; i < maxPoints; i++) {
        const newPoint = {
          x: 0,
          y: 1 - (i / (maxPoints - 1))
        }
        newPoint.x = noise.perlin3(newPoint.x * 100 * (thisEdge + 1), newPoint.y * thisEdge * 100 * (thisEdge + 1), i * 13000) * 0.005
        edge.push(newPoint)
      }
      features.background.edges.push(edge)
    }
  }
  /*
   *
   * This makes the floating buildings
   *
   */
  let light = rgbToHsl(hexToRgb('#FBF3E8'))
  const dark = rgbToHsl(hexToRgb('#362C2B'))
  //   If there's no background make the light version darker
  features.colourfulBuildings = fxrand() < 0.8
  if (!features.background) {
    light = rgbToHsl(hexToRgb('#ACA4A3'))
  } else {
    features.colourfulBuildings = fxrand() < 0.2
  }
  let colourfulChance = 0.333
  if (features.colourfulBuildings) {
    if (fxrand() < 0.2) {
      colourfulChance = 1
    }
  }
  // If the background is yellow, then we make everything dark
  features.buildings = []
  let buildingCount = Math.floor(fxrand() * 14) + 6
  // Maybe have excessive buildings
  if (fxrand() < 0.25) buildingCount += Math.floor(fxrand() * 10) + 5
  for (let i = 0; i < buildingCount; i++) {
    const newBuilding = {
      root: {
        x: fxrand() * 0.8 + 0.1,
        y: fxrand() * 0.8 + 0.1,
        height: fxrand() * 0.1 + 0.1,
        rightSide: fxrand() * 0.05 + 0.1,
        leftSide: fxrand() * 0.05 + 0.1,
        type: 'Normal',
        leftFaceColour: light,
        leftFaceColourName: 'light',
        rightFaceColour: light,
        rightFaceColourName: 'light',
        bottomFaceColour: dark,
        bottomFaceColourName: 'dark',
        randomStore: []
      }
    }
    // If we have colourful buildins then we pick the colours here
    const fullRangeChance = 0 // Should be 0.5
    let colourPick1 = null
    let colourPick2 = null
    if (features.colourfulBuildings) {
      if (fxrand() < colourfulChance) {
        if (fxrand() < fullRangeChance) {
          colourPick1 = Math.floor(fxrand() * RGBCYM.length)
          colourPick2 = Math.floor(fxrand() * RGBCYM.length)
          newBuilding.root.leftFaceColour = RGBCYM[colourPick1]
          newBuilding.root.rightFaceColour = RGBCYM[colourPick1]
          newBuilding.root.bottomFaceColour = RGBCYM[colourPick2]
          if (features.background) {
            while (newBuilding.root.leftFaceColour === features.background.colour) {
              colourPick1 = Math.floor(fxrand() * RGBCYM.length)
              newBuilding.root.leftFaceColour = RGBCYM[colourPick1]
              newBuilding.root.rightFaceColour = RGBCYM[colourPick1]
            }
            while (newBuilding.root.bottomFaceColour === features.background.colour) {
              colourPick2 = Math.floor(fxrand() * RGBCYM.length)
              newBuilding.root.bottomFaceColour = RGBCYM[colourPick2]
            }
          }
        } else {
          colourPick1 = Math.floor(fxrand() * CYM.length)
          colourPick2 = Math.floor(fxrand() * RGB.length)
          newBuilding.root.leftFaceColour = CYM[colourPick1]
          newBuilding.root.rightFaceColour = CYM[colourPick1]
          newBuilding.root.bottomFaceColour = RGB[colourPick2]
          if (features.background) {
            while (newBuilding.root.leftFaceColour === features.background.colour) {
              colourPick1 = Math.floor(fxrand() * CYM.length)
              newBuilding.root.leftFaceColour = CYM[colourPick1]
              newBuilding.root.rightFaceColour = CYM[colourPick1]
            }
            while (newBuilding.root.bottomFaceColour === features.background.colour) {
              colourPick2 = Math.floor(fxrand() * RGB.length)
              newBuilding.root.bottomFaceColour = RGB[colourPick2]
            }
          }
        }
        // Long assed way of doing this
        if (newBuilding.root.leftFaceColour === RED) newBuilding.root.leftFaceColourName = 'red'
        if (newBuilding.root.leftFaceColour === GREEN) newBuilding.root.leftFaceColourName = 'green'
        if (newBuilding.root.leftFaceColour === BLUE) newBuilding.root.leftFaceColourName = 'blue'
        if (newBuilding.root.leftFaceColour === CYAN) newBuilding.root.leftFaceColourName = 'cyan'
        if (newBuilding.root.leftFaceColour === YELLOW) newBuilding.root.leftFaceColourName = 'yellow'
        if (newBuilding.root.leftFaceColour === MAGENTA) newBuilding.root.leftFaceColourName = 'magenta'

        if (newBuilding.root.rightFaceColour === RED) newBuilding.root.rightFaceColourName = 'red'
        if (newBuilding.root.rightFaceColour === GREEN) newBuilding.root.rightFaceColourName = 'green'
        if (newBuilding.root.rightFaceColour === BLUE) newBuilding.root.rightFaceColourName = 'blue'
        if (newBuilding.root.rightFaceColour === CYAN) newBuilding.root.rightFaceColourName = 'cyan'
        if (newBuilding.root.rightFaceColour === YELLOW) newBuilding.root.rightFaceColourName = 'yellow'
        if (newBuilding.root.rightFaceColour === MAGENTA) newBuilding.root.rightFaceColourName = 'magenta'

        if (newBuilding.root.bottomFaceColour === RED) newBuilding.root.bottomFaceColourName = 'red'
        if (newBuilding.root.bottomFaceColour === GREEN) newBuilding.root.bottomFaceColourName = 'green'
        if (newBuilding.root.bottomFaceColour === BLUE) newBuilding.root.bottomFaceColourName = 'blue'
        if (newBuilding.root.bottomFaceColour === CYAN) newBuilding.root.bottomFaceColourName = 'cyan'
        if (newBuilding.root.bottomFaceColour === YELLOW) newBuilding.root.bottomFaceColourName = 'yellow'
        if (newBuilding.root.bottomFaceColour === MAGENTA) newBuilding.root.bottomFaceColourName = 'magenta'

        newBuilding.root.leftFaceColour = rgbToHsl(hexToRgb(newBuilding.root.leftFaceColour))
        newBuilding.root.rightFaceColour = rgbToHsl(hexToRgb(newBuilding.root.rightFaceColour))
        newBuilding.root.bottomFaceColour = rgbToHsl(hexToRgb(newBuilding.root.bottomFaceColour))
      } else {
        newBuilding.root.leftFaceColour = light
        newBuilding.root.leftFaceColourName = 'light'
        newBuilding.root.rightFaceColour = light
        newBuilding.root.rightFaceColourName = 'light'
        newBuilding.root.bottomFaceColour = dark
        newBuilding.root.bottomFaceColourName = 'dark'
      }
    }

    // Load up like a zillion points in the random store
    for (let j = 0; j < 30000; j++) newBuilding.root.randomStore.push(fxrand())

    //  Sometime the right face colour will be the bottom face
    if (fxrand() < 0.2) {
      newBuilding.root.rightFaceColour = dark
      newBuilding.root.rightFaceColourName = 'dark'
    }

    // Now there's the chance we can change the shape a bit
    if (fxrand() < 0.5) {
      newBuilding.root.type = 'Wide'
      if (fxrand() < 0.5) {
        newBuilding.root.rightSide *= 2
      } else {
        newBuilding.root.leftSide *= 2
      }
      // Increased chance of getting flatter
      if (fxrand() < 0.5) {
        newBuilding.root.height *= 0.5
        newBuilding.root.type = 'Flat'
      }
    }

    // Now there's a chance of getting flatter
    if (fxrand() < 0.333) {
      newBuilding.root.height *= 0.5
      newBuilding.root.type = 'Flat'
    } else {
      // If not flatter, then we may get taller
      if (fxrand() < 0.333) {
        newBuilding.root.height *= 2
        newBuilding.root.rightSide *= 0.5
        newBuilding.root.leftSide *= 0.5
        newBuilding.root.type = 'Tall'
      }
    }
    features.buildings.push(newBuilding)

    //  Sometimes we want to add extra buildings onto the flat buildings
    const extraBuilding = JSON.parse(JSON.stringify(newBuilding))
    if (newBuilding.root.type === 'Flat') {
      if (fxrand() < 0.50) {
        //  Add one more building
        extraBuilding.root.y -= (extraBuilding.root.height + 0.015)
        // Even though we have just made it, don't always add it!
        if (fxrand() < 0.50) features.buildings.push(extraBuilding)
      }
      if (fxrand() < 0.25) {
        //  Add one more building
        const extraExtraBuilding = JSON.parse(JSON.stringify(extraBuilding))
        extraExtraBuilding.root.y -= (extraExtraBuilding.root.height + 0.015)
        features.buildings.push(extraExtraBuilding)
      }
    }
    //  If we are tall, then we may want to add a whole new building to it
    if (newBuilding.root.type === 'Tall') {
      if (fxrand() < 0.2) {
        //  Add one more building
        extraBuilding.root.leftSide *= 2
        extraBuilding.root.rightSide *= 2
        extraBuilding.root.height *= 0.25
        extraBuilding.root.y -= fxrand() * extraBuilding.root.height
        features.buildings.push(extraBuilding)
      }
      if (fxrand() < 0.2) {
        const extraExtraBuilding = JSON.parse(JSON.stringify(extraBuilding))
        //  Add one more building
        extraExtraBuilding.root.leftSide *= 2
        extraExtraBuilding.root.rightSide *= 2
        extraExtraBuilding.root.height *= 0.25
        extraExtraBuilding.root.y -= fxrand() * extraExtraBuilding.root.height
        features.buildings.push(extraExtraBuilding)
      }
    }
  }

  // Now split the buildings into two groups, those below 0.5 and those above it
  const buildingsBelow = []
  const buildingsAbove = []
  for (let i = 0; i < features.buildings.length; i++) {
    if (features.buildings[i].root.y - features.buildings[i].root.height < 0.433) {
      features.buildings[i].above = true
      buildingsAbove.push(features.buildings[i])
    } else {
      features.buildings[i].below = true
      buildingsBelow.push(features.buildings[i])
    }
  }
  // Sort the buildings below by the y position
  buildingsBelow.sort((a, b) => b.root.y - a.root.y)
  buildingsAbove.sort((a, b) => a.root.y - b.root.y)

  features.buildings = [...buildingsBelow, ...buildingsAbove]
  // Now we need to sort the buildings array by y position
  // features.buildings.sort((a, b) => a.root.y - b.root.y)
  features.lineGapMod = fxrand() * 200 + 100

  window.$fxhashFeatures['Solid Background'] = 'background' in features
  window.$fxhashFeatures['Colourful buildings'] = features.colourfulBuildings
  window.$fxhashFeatures['All colourful'] = colourfulChance === 1
  window.$fxhashFeatures.Buildings = features.buildings.length
}

//  Call the above make features, so we'll have the window.$fxhashFeatures available
//  for fxhash
makeFeatures()

/*
  *
  * This is the drawing buildings function
  *
  */
const drawBuildings = (ctx, features, w, h) => {
  ctx.lineCap = 'round'
  //  Loop throught the buildings
  features.buildings.forEach((building) => {
    let randomPointer = 0
    // Set the top and bottom point
    const top = {
      x: building.root.x * w,
      y: (building.root.y * h) - (building.root.height * h)
    }
    const bottom = {
      x: building.root.x * w,
      y: building.root.y * h
    }
    //  Set the left and right vanishing points
    const leftVanishingPoint = {
      x: -w / 2,
      y: h / 2
    }
    const rightVanishingPoint = {
      x: w * 1.5,
      y: h / 2
    }
    //  Work out the top right point.
    // The x is the rightSide between the top point x and the right vanishing point x
    // The y is the rightSide between the top point y and the right vanishing point y
    const topRight = {
      x: top.x + (rightVanishingPoint.x - top.x) * building.root.rightSide,
      y: top.y + (rightVanishingPoint.y - top.y) * building.root.rightSide
    }
    const bottomRight = {
      x: bottom.x + (rightVanishingPoint.x - bottom.x) * building.root.rightSide,
      y: bottom.y + (rightVanishingPoint.y - bottom.y) * building.root.rightSide
    }
    const topLeft = {
      x: top.x + (leftVanishingPoint.x - top.x) * building.root.leftSide,
      y: top.y + (leftVanishingPoint.y - top.y) * building.root.leftSide
    }
    const bottomLeft = {
      x: bottom.x + (leftVanishingPoint.x - bottom.x) * building.root.leftSide,
      y: bottom.y + (leftVanishingPoint.y - bottom.y) * building.root.leftSide
    }
    // Now we need to work out the very bottom point.
    // The bottom point is the intersection of the line from bottomRight to leftVaningPoint and bottomLeft to rightVanishingPoint
    // We can work out the gradient of the line from bottomRight to leftVanishingPoint§
    const bottomRightGradient = (bottomRight.y - leftVanishingPoint.y) / (bottomRight.x - leftVanishingPoint.x)
    //  And the gradient of the line from bottomLeft to rightVanishingPoint
    const bottomLeftGradient = (bottomLeft.y - rightVanishingPoint.y) / (bottomLeft.x - rightVanishingPoint.x)
    //  And the y intercept of the line from bottomRight to leftVanishingPoint
    const bottomRightYIntercept = bottomRight.y - (bottomRightGradient * bottomRight.x)
    //  And the y intercept of the line from bottomLeft to rightVanishingPoint
    const bottomLeftYIntercept = bottomLeft.y - (bottomLeftGradient * bottomLeft.x)
    //  Now we can work out the x value of the intersection
    const bottomX = (bottomLeftYIntercept - bottomRightYIntercept) / (bottomRightGradient - bottomLeftGradient)
    //  And the y value of the intersection
    const bottomY = (bottomRightGradient * bottomX) + bottomRightYIntercept
    const veryBottom = {
      x: bottomX,
      y: bottomY
    }
    // Do the same for the very top point
    const topRightGradient = (topRight.y - leftVanishingPoint.y) / (topRight.x - leftVanishingPoint.x)
    const topLeftGradient = (topLeft.y - rightVanishingPoint.y) / (topLeft.x - rightVanishingPoint.x)
    const topRightYIntercept = topRight.y - (topRightGradient * topRight.x)
    const topLeftYIntercept = topLeft.y - (topLeftGradient * topLeft.x)
    const topX = (topLeftYIntercept - topRightYIntercept) / (topRightGradient - topLeftGradient)
    const topY = (topRightGradient * topX) + topRightYIntercept
    const veryTop = {
      x: topX,
      y: topY
    }

    const yShift = h * 0.1
    const lineGap = w / features.lineGapMod
    ctx.lineWidth = w / 1500
    // Draw the right face
    const rFC = building.root.rightFaceColour

    const rightFaceBottomRow = []
    let catchBottomRow = true
    // Draw the right hand side, starting at the bottom x,y and working up in steps of lineGap
    for (let startY = bottom.y + yShift; startY > top.y + yShift; startY -= lineGap) {
      // Work out the percent value of thisY between the two points
      const yPercent = (bottom.y + yShift - startY) / (bottom.y - top.y)
      // Now get the endY point by working out the percent between the bottomRight and topRight points
      const endY = bottomRight.y - ((bottomRight.y - topRight.y) * yPercent) + yShift

      // Now we need to work out the x value of the end point
      for (let startX = bottom.x; startX < bottomRight.x; startX += lineGap / 4) {
        // Now work out the xPercent
        const xPercent = (startX - bottom.x) / (bottomRight.x - bottom.x)
        // Work out the pointY based on the yPercent of the y distance between startY and endY
        const pointY = startY - ((startY - endY) * xPercent)

        ctx.strokeStyle = `hsl(${rFC.h}, ${rFC.s}%, ${rFC.l * (building.root.randomStore[randomPointer] * 0.4 - 0.2 + 1)}%)`
        ctx.beginPath()
        ctx.arc(startX, pointY, lineGap / 4 * building.root.randomStore[randomPointer], 0, 2 * Math.PI)
        ctx.stroke()

        if (!plotted) {
          plot[building.root.rightFaceColourName].push({
            x: startX / w * 0.94 + 0.03,
            y: pointY / h * 0.94 + 0.03,
            r: lineGap / 4 * building.root.randomStore[randomPointer] / w * 0.94
          })
        }

        randomPointer++
        if (catchBottomRow) {
          rightFaceBottomRow.push({
            x: startX,
            y: pointY
          })
        }
      }
      catchBottomRow = false
    }
    //  remove the first entry from the bottom row
    rightFaceBottomRow.shift()

    // Draw the left face
    const lFC = building.root.leftFaceColour
    const leftFaceBottomRow = []
    // Draw the left hand side, starting at the bottom x,y and working up in steps of lineGap
    catchBottomRow = true
    for (let startY = bottom.y + yShift; startY > top.y + yShift; startY -= lineGap) {
      // Work out the percent value of thisY between the two points
      const yPercent = (bottom.y + yShift - startY) / (bottom.y - top.y)
      // Now get the endY point by working out the percent between the bottomLeft and topLeft points
      const endY = bottomLeft.y - ((bottomLeft.y - topLeft.y) * yPercent) + yShift

      // Now we need to work out the x value of the end point
      let firstOne = true
      for (let startX = bottom.x; startX > bottomLeft.x; startX -= lineGap / 4) {
        // Now work out the xPercent
        const xPercent = (startX - bottom.x) / (bottomLeft.x - bottom.x)
        // Work out the pointY based on the yPercent of the y distance between startY and endY
        const pointY = startY - ((startY - endY) * xPercent)

        // ctx.strokeStyle = 'black'
        // Don't draw the first one, as we've already done it with the other face
        if (!firstOne) {
          ctx.strokeStyle = `hsl(${lFC.h}, ${lFC.s}%, ${lFC.l * (building.root.randomStore[randomPointer] * 0.4 - 0.2 + 1)}%)`
          ctx.beginPath()
          ctx.arc(startX, pointY, lineGap / 4 * building.root.randomStore[randomPointer], 0, 2 * Math.PI)
          ctx.stroke()

          if (!plotted) {
            plot[building.root.leftFaceColourName].push({
              x: startX / w * 0.94 + 0.03,
              y: pointY / h * 0.94 + 0.03,
              r: lineGap / 4 * building.root.randomStore[randomPointer] / w * 0.94
            })
          }

          randomPointer++
          if (catchBottomRow) {
            leftFaceBottomRow.push({
              x: startX,
              y: pointY
            })
          }
        }
        firstOne = false
      }
      catchBottomRow = false
    }

    const bFC = building.root.bottomFaceColour
    if (bottom.y / h < 0.5) {
      // Loop through the bottom left row array
      for (let i = 0; i < leftFaceBottomRow.length; i += 2) {
        const thisPoint = leftFaceBottomRow[i]
        const leftPercent = i / leftFaceBottomRow.length
        // The start X & Y point is the point x, y
        const startX = thisPoint.x
        const startY = thisPoint.y
        // Work out the end point by working out the percent between the bottom right and very bottom point
        const endX = bottomRight.x - ((bottomRight.x - veryBottom.x) * leftPercent)
        const endY = bottomRight.y + ((veryBottom.y - bottomRight.y) * leftPercent) + yShift

        //   Now loop through the bottom right row array
        for (let j = 0; j < rightFaceBottomRow.length; j += 2) {
          // const thisPoint = rightFaceBottomRow[j]
          const rightPercent = j / rightFaceBottomRow.length
          // GRab the x value betwen the startX and endX
          const pointX = startX + ((endX - startX) * rightPercent)
          // Grab the y value between the startY and endY
          const pointY = startY + ((endY - startY) * rightPercent)
          ctx.strokeStyle = `hsl(${bFC.h}, ${bFC.s}%, ${bFC.l * (building.root.randomStore[randomPointer] * 0.4 - 0.2 + 1) * 0.666}%)`
          ctx.beginPath()
          ctx.arc(pointX, pointY, lineGap / 4 * building.root.randomStore[randomPointer], 0, 2 * Math.PI)
          ctx.stroke()

          if (!plotted) {
            plot[building.root.bottomFaceColourName].push({
              x: pointX / w * 0.94 + 0.03,
              y: pointY / h * 0.94 + 0.03,
              r: lineGap / 4 * building.root.randomStore[randomPointer] / w * 0.94
            })
          }

          randomPointer++
        }
      }
    }

    // Do the same again for the top face
    let tFC = building.root.bottomFaceColour
    let topFaceName = building.root.bottomFaceColourName
    if (features.background && features.background.colour === YELLOW) {
      tFC = building.root.leftFaceColour
      topFaceName = building.root.leftFaceColourName
    }

    if (top.y / h > 0.5) {
      // Loop through the bottom left row array
      for (let i = 0; i < leftFaceBottomRow.length; i += 2) {
        // const thisPoint = leftFaceBottomRow[i]
        const leftPercent = i / leftFaceBottomRow.length
        // The start X & Y point is the point x, y
        const startX = top.x - ((top.x - topLeft.x) * leftPercent)
        const startY = top.y - ((top.y - topLeft.y) * leftPercent) + yShift
        // Work out the end point by working out the percent between the bottom right and very bottom point
        const endX = topRight.x - ((topRight.x - veryTop.x) * leftPercent)
        const endY = topRight.y + ((veryTop.y - topRight.y) * leftPercent) + yShift

        //   Now loop through the bottom right row array
        for (let j = 0; j < rightFaceBottomRow.length; j += 2) {
          // const thisPoint = rightFaceBottomRow[j]
          const rightPercent = j / rightFaceBottomRow.length
          // GRab the x value betwen the startX and endX
          const pointX = startX + ((endX - startX) * rightPercent)
          // Grab the y value between the startY and endY
          const pointY = startY + ((endY - startY) * rightPercent)
          ctx.strokeStyle = `hsl(${tFC.h}, ${tFC.s}%, ${tFC.l * (building.root.randomStore[randomPointer] * 0.4 - 0.2 + 1) * 1.2}%)`
          ctx.beginPath()
          ctx.arc(pointX, pointY, lineGap / 4 * building.root.randomStore[randomPointer], 0, 2 * Math.PI)
          ctx.stroke()

          if (!plotted) {
            plot[topFaceName].push({
              x: pointX / w * 0.94 + 0.03,
              y: pointY / h * 0.94 + 0.03,
              r: lineGap / 4 * building.root.randomStore[randomPointer] / w * 0.94
            })
          }

          randomPointer++
        }
      }
    }
  })
}

/*
  *
  * Draw the coloured background
  *
  */
const drawBackground = (ctx, features, w, h, borderSize) => {
  // Set the background colour
  ctx.fillStyle = features.background.colour
  const rgb = hexToRgb(features.background.colour)
  const hsl = rgbToHsl(rgb)
  // Set the composition mode to lighted
  ctx.fillStyle = `hsla(${hsl.h},${hsl.s}%,${hsl.l}%, 0.8)`

  // Draw the background
  // Loop through the background edges
  for (let i = 1; i < features.background.edges.length; i++) {
    let edge = features.background.edges[i]
    // Now we need to map all the points to the canvas size
    edge = edge.map((point) => {
      return {
        x: (w * borderSize) + ((w - (w * borderSize * 2)) * point.x),
        y: (h * borderSize) + ((h - (h * borderSize * 2)) * point.y)
      }
    })
    //  Now draw a path from the points
    ctx.beginPath()
    ctx.moveTo(edge[0].x, edge[0].y)
    for (let j = 1; j < edge.length; j++) {
      ctx.lineTo(edge[j].x, edge[j].y)
    }
    ctx.closePath()
    ctx.fill()
  }
}

// We want a pretty number format function that adds the commas
const prettyNumber = (num) => {
  return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
}

const drawCanvas = async () => {
  //  Let the preloader know that we've hit this function at least once
  drawStarted = true
  // Grab all the canvas stuff
  const canvas = document.getElementById('target')
  const ctx = canvas.getContext('2d')
  const w = canvas.width
  const h = canvas.height

  //  Lay down the paper texture
  if (drawPaper) {
    ctx.fillStyle = features.paper1Pattern
    ctx.save()
    ctx.translate(-w * features.paperOffset.paper1.x, -h * features.paperOffset.paper1.y)
    ctx.fillRect(0, 0, w * 2, h * 2)
    ctx.restore()
  } else {
    ctx.fillStyle = '#F9F9F9'
    ctx.fillRect(0, 0, w, h)
  }

  // Set the border width
  const borderSize = 0.02

  if (features.background) drawBackground(ctx, features, w, h, borderSize)
  if (features.buildings) drawBuildings(ctx, features, w, h)

  if (!thumbnailTaken) {
    thumbnailTaken = true
    fxpreview()
  }
  if (!plotted) {
    plotted = true
    // console log out all the total points
    console.log('Light: ', prettyNumber(plot.light.length))
    console.log('Dark: ', prettyNumber(plot.dark.length))
    console.log('Red: ', prettyNumber(plot.red.length))
    console.log('Green: ', prettyNumber(plot.green.length))
    console.log('Blue: ', prettyNumber(plot.blue.length))
    console.log('Cyan: ', prettyNumber(plot.cyan.length))
    console.log('Yellow: ', prettyNumber(plot.yellow.length))
    console.log('Magenta: ', prettyNumber(plot.magenta.length))
    // Now total up all the points and log them out
    let total = 0
    Object.keys(plot).forEach((key) => {
      total += plot[key].length
    })
    console.log('Total: ', prettyNumber(total))
  }

  // >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
  //
  // Below is code that is common to all the projects, there may be some
  // customisation for animated work or special cases

  // Try various methods to tell the parent window that we've drawn something
  if (!thumbnailTaken) {
    try {
      $fx.preview()
    } catch (e) {
      try {
        fxpreview()
      } catch (e) {
      }
    }
    thumbnailTaken = true
  }

  // If we are forcing download, then do that now
  if (dumpOutputs || ('forceDownload' in urlParams && forceDownloaded === false)) {
    forceDownloaded = 'forceDownload' in urlParams
    await autoDownloadCanvas()
    // Tell the parent window that we have downloaded
    window.parent.postMessage('forceDownloaded', '*')
  } else {
    //  We should wait for the next animation frame here
    // nextFrame = window.requestAnimationFrame(drawCanvas)
  }
  //
  // <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
//
// These are the common functions that are used by the canvas that we use
// across all the projects, init sets up the resize event and kicks off the
// layoutCanvas function.
//
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

//  Call this to start everything off
const init = async () => {
  // Resize the canvas when the window resizes, but only after 100ms of no resizing
  window.addEventListener('resize', async () => {
    //  If we do resize though, work out the new size...
    clearTimeout(resizeTmr)
    resizeTmr = setTimeout(async () => {
      await layoutCanvas()
    }, 100)
  })

  //  Now layout the canvas
  await layoutCanvas()
}

//  This is where we layout the canvas, and redraw the textures
const layoutCanvas = async (windowObj = window, urlParamsObj = urlParams) => {
  //  Kill the next animation frame (note, this isn't always used, only if we're animating)
  windowObj.cancelAnimationFrame(nextFrame)

  //  Get the window size, and devicePixelRatio
  const { innerWidth: wWidth, innerHeight: wHeight, devicePixelRatio = 1 } = windowObj
  let dpr = devicePixelRatio
  let cWidth = wWidth
  let cHeight = cWidth * ratio

  if (cHeight > wHeight) {
    cHeight = wHeight
    cWidth = wHeight / ratio
  }

  // Grab any canvas elements so we can delete them
  const canvases = document.getElementsByTagName('canvas')
  Array.from(canvases).forEach(canvas => canvas.remove())

  // Now set the target width and height
  let targetHeight = highRes ? 4096 : cHeight
  let targetWidth = targetHeight / ratio

  //  If the alba params are forcing the width, then use that (only relevant for Alba)
  if (windowObj.alba?.params?.width) {
    targetWidth = window.alba.params.width
    targetHeight = Math.floor(targetWidth * ratio)
  }

  // If *I* am forcing the width, then use that, and set the dpr to 1
  // (as we want to render at the exact size)
  if ('forceWidth' in urlParams) {
    targetWidth = parseInt(urlParams.forceWidth)
    targetHeight = Math.floor(targetWidth * ratio)
    dpr = 1
  }

  // Update based on the dpr
  targetWidth *= dpr
  targetHeight *= dpr

  //  Set the canvas width and height
  const canvas = document.createElement('canvas')
  canvas.id = 'target'
  canvas.width = targetWidth
  canvas.height = targetHeight
  document.body.appendChild(canvas)

  canvas.style.position = 'absolute'
  canvas.style.width = `${cWidth}px`
  canvas.style.height = `${cHeight}px`
  canvas.style.left = `${(wWidth - cWidth) / 2}px`
  canvas.style.top = `${(wHeight - cHeight) / 2}px`

  // >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
  //
  // Custom code (for defining textures and buffer canvas goes here) if needed
  //

  //  Re-Create the paper pattern
  const paper1 = document.createElement('canvas')
  paper1.width = canvas.width / 2
  paper1.height = canvas.height / 2
  const paper1Ctx = paper1.getContext('2d')
  await paper1Ctx.drawImage(paper1Loaded, 0, 0, 1920, 1920, 0, 0, paper1.width, paper1.height)
  features.paper1Pattern = paper1Ctx.createPattern(paper1, 'repeat')

  const paper2 = document.createElement('canvas')
  paper2.width = canvas.width / (22 / 7)
  paper2.height = canvas.height / (22 / 7)
  const paper2Ctx = paper2.getContext('2d')
  await paper2Ctx.drawImage(paper1Loaded, 0, 0, 1920, 1920, 0, 0, paper2.width, paper2.height)
  features.paper2Pattern = paper2Ctx.createPattern(paper2, 'repeat')

  drawCanvas()
}

//  This allows us to download the canvas as a PNG
// If we are forcing the id then we add that to the filename
const autoDownloadCanvas = async () => {
  const canvas = document.getElementById('target')

  // Create a download link
  const element = document.createElement('a')
  const filename = 'forceId' in urlParams
    ? `${prefix}_${urlParams.forceId.toString().padStart(4, '0')}_${fxhash}`
    : `${prefix}_${fxhash}`
  element.setAttribute('download', filename)

  // Hide the link element
  element.style.display = 'none'
  document.body.appendChild(element)

  // Convert canvas to Blob and set it as the link's href
  const imageBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'))
  element.setAttribute('href', window.URL.createObjectURL(imageBlob))

  // Trigger the download
  element.click()

  // Clean up by removing the link element
  document.body.removeChild(element)

  // Reload the page if dumpOutputs is true
  if (dumpOutputs) {
    window.location.reload()
  }
}

const PAPER = { // eslint-disable-line no-unused-vars
  A1: [59.4, 59.4],
  A2: [42.0, 42.0],
  A3: [29.7, 29.7],
  A4: [21.0, 21.0],
  A5: [14.8, 14.8],
  A6: [10.5, 10.5]
}

const downloadSVG = async size => {
  if (plot.light.length) await wrapSVG(plot.light, PAPER[size], `BRTLSMBRTHDAY_light_${size}_${fxhash}`)
  if (plot.dark.length) await wrapSVG(plot.dark, PAPER[size], `BRTLSMBRTHDAY_dark_${size}_${fxhash}`)
  if (plot.red.length) await wrapSVG(plot.red, PAPER[size], `BRTLSMBRTHDAY_red_${size}_${fxhash}`)
  if (plot.green.length) await wrapSVG(plot.green, PAPER[size], `BRTLSMBRTHDAY_green_${size}_${fxhash}`)
  if (plot.blue.length) await wrapSVG(plot.blue, PAPER[size], `BRTLSMBRTHDAY_blue_${size}_${fxhash}`)
  if (plot.cyan.length) await wrapSVG(plot.cyan, PAPER[size], `BRTLSMBRTHDAY_cyan_${size}_${fxhash}`)
  if (plot.yellow.length) await wrapSVG(plot.yellow, PAPER[size], `BRTLSMBRTHDAY_yellow_${size}_${fxhash}`)
  if (plot.magenta.length) await wrapSVG(plot.magenta, PAPER[size], `BRTLSMBRTHDAY_magenta_${size}_${fxhash}`)
}

const wrapSVG = async (points, size, filename) => {
  //  Turn the points into an array of lines
  const lines = []
  const segments = 8
  const angle = 360 / segments
  //   Loop through the points
  for (let i = 0; i < points.length; i++) {
    //  Grab the point
    const point = points[i]
    if (point.x > 0 && point.x < 1 && point.y > 0 && point.y < 1) {
      // Now make the circle
      const circle = []
      for (let s = 0; s <= segments; s++) {
        const adjustedAngle = ((angle * s) * Math.PI / 180)
        const x = Math.cos(adjustedAngle) * point.r + point.x
        const y = Math.sin(adjustedAngle) * point.r + point.y
        circle.push({ x, y })
      }
      lines.push(circle)
    }
  }

  let output = `<?xml version="1.0" standalone="no" ?>
  <!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" 
      "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
      <svg version="1.1" id="lines" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
      x="0" y="0"
      viewBox="0 0 ${size[0]} ${size[1]}"
      width="${size[0]}cm"
      height="${size[1]}cm" 
      xml:space="preserve">`

  output += `
      <g>
      <path d="`
  lines.forEach(points => {
    output += `M ${points[0].x * size[0]} ${points[0].y * size[1]} `
    for (let p = 1; p < points.length; p++) {
      output += `L ${points[p].x * size[0]} ${points[p].y * size[1]} `
    }
  })
  output += `"  fill="none" stroke="black" stroke-width="0.05"/>
    </g>`
  output += '</svg>'

  const element = document.createElement('a')
  element.setAttribute('download', `${filename}.svg`)
  element.style.display = 'none'
  document.body.appendChild(element)
  element.setAttribute('href', window.URL.createObjectURL(new Blob([output], {
    type: 'text/plain;charset=utf-8'
  })))
  element.click()
  document.body.removeChild(element)
}

//  KEY PRESSED OF DOOM
document.addEventListener('keypress', async (e) => {
  e = e || window.event
  // == Common controls ==
  // Save
  if (e.key === 's') autoDownloadCanvas()

  //   Toggle highres mode
  if (e.key === 'h') {
    highRes = !highRes
    console.log('Highres mode is now', highRes)
    await layoutCanvas()
  }

  // Custom controls

  // Toggle the paper texture
  if (e.key === 't') {
    drawPaper = !drawPaper
    await layoutCanvas()
  }

  if (e.key === '1') downloadSVG('A1')
  if (e.key === '2') downloadSVG('A2')
  if (e.key === '3') downloadSVG('A3')
  if (e.key === '4') downloadSVG('A4')
  if (e.key === '5') downloadSVG('A5')
  if (e.key === '6') downloadSVG('A6')
})

//  This preloads the images so we can get access to them
// eslint-disable-next-line no-unused-vars
const preloadImages = () => {
  //  Normally we would have a test
  // if (true === true) {
  if (paper1Loaded && !drawStarted) {
    clearInterval(preloadImagesTmr)
    init()
  }
}

console.table(window.$fxhashFeatures)
