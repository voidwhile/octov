import type AbilityConstant from "@ohos:app.ability.AbilityConstant";
import UIAbility from "@ohos:app.ability.UIAbility";
import type Want from "@ohos:app.ability.Want";
import type window from "@ohos:window";
import hilog from "@ohos:hilog";
const DOMAIN_NUMBER: number = 0xFF00;
const TAG: string = 'EntryAbility';
export default class EntryAbility extends UIAbility {
    onCreate(c: Want, d: AbilityConstant.LaunchParam): void {
        hilog.info(DOMAIN_NUMBER, TAG, 'Ability onCreate');
    }
    onWindowStageCreate(a: window.WindowStage): void {
        a.loadContent('pages/Index', (b) => {
            if (b.code) {
                hilog.error(DOMAIN_NUMBER, TAG, 'Failed to load the content. Cause: %{public}s', JSON.stringify(b));
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
