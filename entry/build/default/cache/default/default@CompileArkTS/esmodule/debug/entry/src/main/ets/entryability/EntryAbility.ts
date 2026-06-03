import type AbilityConstant from "@ohos:app.ability.AbilityConstant";
import UIAbility from "@ohos:app.ability.UIAbility";
import type Want from "@ohos:app.ability.Want";
import type window from "@ohos:window";
import hilog from "@ohos:hilog";
import { OctovRepository } from "@normalized:N&&&entry/src/main/ets/services/OctovServices&";
const DOMAIN_NUMBER: number = 0xFF00;
const TAG: string = 'EntryAbility';
export default class EntryAbility extends UIAbility {
    onCreate(want: Want, launchParam: AbilityConstant.LaunchParam): void {
        hilog.info(DOMAIN_NUMBER, TAG, 'Ability onCreate');
        OctovRepository.shared().setAbilityContext(this.context);
    }
    onWindowStageCreate(windowStage: window.WindowStage): void {
        windowStage.loadContent('pages/Index', (err) => {
            if (err.code) {
                hilog.error(DOMAIN_NUMBER, TAG, 'Failed to load the content. Cause: %{public}s', JSON.stringify(err));
                return;
            }
            hilog.info(DOMAIN_NUMBER, TAG, 'Succeeded in loading the content.');
        });
    }
    onWindowStageDestroy(): void {
        hilog.info(DOMAIN_NUMBER, TAG, 'Ability onWindowStageDestroy');
    }
    onForeground(): void {
        hilog.info(DOMAIN_NUMBER, TAG, 'Ability onForeground');
    }
    onBackground(): void {
        hilog.info(DOMAIN_NUMBER, TAG, 'Ability onBackground');
    }
}
