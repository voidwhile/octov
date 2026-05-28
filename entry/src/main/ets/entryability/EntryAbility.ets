import { AbilityConstant, UIAbility, Want } from '@kit.AbilityKit'
import { window } from '@kit.ArkUI'
import { hilog } from '@kit.PerformanceAnalysisKit'

const DOMAIN_NUMBER: number = 0xFF00
const TAG: string = 'EntryAbility'

export default class EntryAbility extends UIAbility {
  onCreate(want: Want, launchParam: AbilityConstant.LaunchParam): void {
    hilog.info(DOMAIN_NUMBER, TAG, 'Ability onCreate')
  }

  onWindowStageCreate(windowStage: window.WindowStage): void {
    windowStage.loadContent('pages/Index', (err) => {
      if (err.code) {
        hilog.error(DOMAIN_NUMBER, TAG, 'Failed to load the content. Cause: %{public}s', JSON.stringify(err))
        return
      }
      hilog.info(DOMAIN_NUMBER, TAG, 'Succeeded in loading the content.')
    })
  }

  onWindowStageDestroy(): void {
    hilog.info(DOMAIN_NUMBER, TAG, 'Ability onWindowStageDestroy')
  }

  onForeground(): void {
    hilog.info(DOMAIN_NUMBER, TAG, 'Ability onForeground')
  }

  onBackground(): void {
    hilog.info(DOMAIN_NUMBER, TAG, 'Ability onBackground')
  }
}
