import { splitLast, TSForceType } from "@tsukiweb-common/utils/utils"
import { RouteDayName, RouteName } from "../types"
import { settings } from "../utils/settings"
import {TrackSourceId, languages, strings} from "./lang"
import { ImageRedirect, TextImage } from "@tsukiweb-common/utils/lang"
import { closeBB } from "@tsukiweb-common/utils/Bbcode"
import { supportAvif, testAvifSupport } from "@tsukiweb-common/utils/images"

//##############################################################################
//#                                  PRIVATE                                   #
//##############################################################################

//______________________________private constants_______________________________
//------------------------------------------------------------------------------

const ASSETS_PATH = `${import.meta.env.BASE_URL}static/`

//______________________________private functions_______________________________
//------------------------------------------------------------------------------

function assetPath(basePath: string) {
  if (!/^\w+:\/\//.test(basePath)) // does not start with "<protocol>://"
    return ASSETS_PATH + basePath
  else
    return basePath
}

function textImageToStr(textImg: TextImage): string {
  const {center, top, bottom, bg="#000000"} = textImg
  let [text, vAlign] = center ? [center, 'c'] :
                       top    ? [top   , 't'] :
                       bottom ? [bottom, 'b'] :
                       [null, '']
  if (text) {
    if (Array.isArray(text))
      text = text.map(closeBB).join('\n')
    text = `$${vAlign}\`${text}\``
  }
  return `${bg}${text??""}`
}

//##############################################################################
//#                                   PUBLIC                                   #
//##############################################################################

//_______________________________public functions_______________________________
//------------------------------------------------------------------------------

export function scenesDir() {
  return assetPath(`${languages[settings.language].dir}/scenes`)
}

export function spriteSheetImgPath(file: string) {
  if (supportAvif === null) {
    testAvifSupport()
  }
  file = supportAvif ? file.replace(/\.webp$/, '.avif') : file
	return assetPath(`jp/flowchart-spritesheet/${file}`)
}

function audioPath(formats: string|string[], num: number|string) {
  const paddedNum = num.toString().padStart(2, '0')
  let format
  if (formats.constructor == String)
    format = formats
  else if (formats.length == 1)
    format = (formats as string[])[0]
  else {
    const audio = document.createElement('audio')
    format = (formats as string[]).find((f)=> {
      const [_, ext] = splitLast(f, '.')
      switch (ext) {
        case null : return true
        case 'mp3' : return true // consider all browser can play mp3
        case 'wav' : return true
        case 'opus' : return audio.canPlayType('audio/webm; codecs="opus"') == "probably"
        default : return true
      }
    }) ?? formats[formats.length-1]
  }
  return assetPath(format.replace('$', paddedNum))
}

export function audioTrackPath(track: number|string,
                               source: TrackSourceId = settings.trackSource) {
  return audioPath(strings.audio["track-sources"][source].path, track)
}

export function audioSePath(se: number|string) {
  return audioPath(strings.audio["waves-path"], se)
}

/**
 * Get the image source from the translation file.
 * @param img id of the image to get its source
 * @param res desired resolution. any of 'hd', 'sd' or 'thumb'
 * @returns the requested image's url
 */
export function imageSrc(img: string, res=settings.resolution) {
  if (img.startsWith('"'))
    img = img.replaceAll(/(^")|"$/g, '')
  let imgRedirect = strings.images["redirected-images"][img] ?? ""
  if (imgRedirect.constructor == String) {
    if (imgRedirect.startsWith('#'))
      return imgRedirect
    imgRedirect = strings.images["redirect-ids"][imgRedirect]
  }
  else {
    TSForceType<ImageRedirect<string>>(imgRedirect)
  }
  if (res == "thumb" && !("thumb" in imgRedirect))
    res = "sd"
  if (res == "sd" && !("sd" in imgRedirect))
    res = "hd"
  else if (res == "hd" && !("hd" in imgRedirect))
    res = "sd"
  let src = imgRedirect[res].replace('$', img)
  if (src.startsWith('#'))
    return src
  return assetPath(src)
}

/**
 * Get the formatted string that replaces the image.
 * @param img image id to convert
 * @returns the formatted string that replaces the image
 */
export function wordImage(img: string) : string {
  if (img.startsWith("word/"))
    img = img.substring("word/".length)
  const textImage = strings.images.words[img]
  if (!textImage) {
    throw Error(`unknown word-image ${img}`)
  }
  return textImageToStr(textImage)
}

/**
 * Get the list of formatted strings and delays for the credits.
 * @returns the list of formatted strings and delays
 */
export function credits() : [string, number][] {
  return strings.credits.map(
    ({delay=5600, ...textImage})=> [textImageToStr(textImage), delay]
  )
}

/**
 * Get the phase title and subtitle texts.
 * @param route current route
 * @param routeDay section of the route
 * @param day day number, or special section
 * @returns an array of two elements where the first element is the text
 *          for the title, and the second element is the text for the subtitle
 */
export function phaseTexts(route: RouteName, routeDay: RouteDayName, day: number|RouteDayName<"others">): [string, string] {
  
  const titleString = strings.scenario.routes[route][routeDay as RouteDayName]
  let dayString: string
  if (isNaN(day as number))
    dayString = strings.scenario.days[+day - 1]
  else if ((day as string).length > 0)
    dayString = strings.scenario.routes['others'][day as RouteDayName<"others">]
  else
    dayString = ""

  return [titleString, dayString]
}