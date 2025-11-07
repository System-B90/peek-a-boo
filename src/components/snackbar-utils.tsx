/* eslint-disable @typescript-eslint/no-explicit-any */
import { UserNotLoggedInError, ClientApiError } from "@/shared-api/errors";
import { Typography } from "@mui/material";
import { enqueueSnackbar, EnqueueSnackbar, OptionsObject, VariantType } from "notistack";

export function reportGeneralServerErrorWithSnackbar(enqueueSnackbar: EnqueueSnackbar)
{
    enqueueSnackbar(`A general server error has occured!`, { variant: 'error' });
}

export function enqueueSnackbarWithSubtext(
    enqueueSnackbar: EnqueueSnackbar | undefined,
    mainText: string | React.ReactNode,
    subText: string | React.ReactNode,
    options?: OptionsObject<VariantType>
)
{
    if (enqueueSnackbar !== undefined)
    {
        if (typeof subText === 'string')
        {
            enqueueSnackbar(<div className='flex flex-col'><p>{ mainText }</p><p style={ { fontSize: '0.7em' } }>{ subText }</p></div>, options);
        }
        else
        {
            enqueueSnackbar(<div className='flex flex-col'><p>{ mainText }</p><div style={ { fontSize: '0.7em' } }>{ subText }</div></div>, options);
        }
    }
    else
    {
        console.log(mainText, subText);
    }
}

export function enqueueApiErrorSnackbar(mainText: string | React.ReactNode, error: any)
{
    if (error instanceof UserNotLoggedInError) { console.error(error.message); return; }

    if (!(error instanceof ClientApiError))
    {
        return enqueueSnackbarWithSubtext(
            enqueueSnackbar, mainText,
            `${error}`, { variant: 'error' }
        );
    }
    else
    {
        console.error(error);
        return enqueueSnackbarWithSubtext(
            enqueueSnackbar, mainText,
            <>
                <Typography fontSize={ 'inherit' } fontWeight={ 500 }>{ error.name }{ error.message ? ': ' : '' }</Typography><Typography fontSize={ 'inherit' } fontWeight={ 400 }>{ error.message }</Typography>
                {
                    error.status &&
                    <Typography fontSize={ 'inherit' } fontWeight={ 400 }>{ error.status }</Typography>
                }
            </>,
            { variant: 'error' }
        );
    }
}
