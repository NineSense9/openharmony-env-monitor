#include "los_task.h"

void task_helloworld(void)
{
    while (1) {
        printf("Hello World\n");
        LOS_Msleep(1000);
    }
}

void task_openharmony(void)
{
    while (1) {
        printf("Hello OpenHarmony\n");
        LOS_Msleep(2000);
    }
}

void task_example(void)
{
    unsigned int thread_id1;
    unsigned int thread_id2;
    TSK_INIT_PARAM_S task1 = {0};
    TSK_INIT_PARAM_S task2 = {0};

    task1.pfnTaskEntry = (TSK_ENTRY_FUNC)task_helloworld;
    task1.uwStackSize = 2048;
    task1.pcName = "task_helloworld";
    task1.usTaskPrio = 24;
    if (LOS_TaskCreate(&thread_id1, &task1) != LOS_OK) {
        printf("Failed to create task_helloworld\n");
        return;
    }

    task2.pfnTaskEntry = (TSK_ENTRY_FUNC)task_openharmony;
    task2.uwStackSize = 2048;
    task2.pcName = "task_openharmony";
    task2.usTaskPrio = 25;
    if (LOS_TaskCreate(&thread_id2, &task2) != LOS_OK) {
        printf("Failed to create task_openharmony\n");
    }
}
